<?php

namespace App\Services\Discovery;

use App\Models\Community;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventModality;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * Applies interpreted filters to the database and explains each match with
 * fixed templates built only from stored data.
 */
class DiscoveryService
{
    public const EVENT_LIMIT = 10;

    public const COMMUNITY_LIMIT = 3;

    private const CANDIDATE_LIMIT = 50;

    public const WEEKDAY_NAMES = [
        1 => 'lunes', 2 => 'martes', 3 => 'miércoles', 4 => 'jueves', 5 => 'viernes', 6 => 'sábado', 7 => 'domingo',
    ];

    public function __construct(
        private readonly DiscoveryKeywords $keywords,
    ) {}

    public function search(DiscoveryInterpretation $interpretation): DiscoveryResult
    {
        $terms = $this->keywords->searchTerms($interpretation->keywords);

        return new DiscoveryResult(
            interpretation: $interpretation,
            events: $this->events($interpretation, $terms),
            communities: $this->communities($interpretation, $terms),
            categoryNames: EventCategory::query()->whereIn('code', $interpretation->categories)->pluck('name', 'code')->all(),
            modalityNames: EventModality::query()->whereIn('code', $interpretation->modalities)->pluck('name', 'code')->all(),
        );
    }

    /**
     * @param  array<int, string>  $terms
     * @return array<int, array{event: Event, reasons: array<int, string>}>
     */
    private function events(DiscoveryInterpretation $interpretation, array $terms): array
    {
        $events = Event::query()
            ->publiclyListed()
            ->withAvailableSeats()
            ->when($interpretation->categories !== [], fn (Builder $query) => $query->inCategories($interpretation->categories))
            ->when($interpretation->modalities !== [], fn (Builder $query) => $query->inModalities($interpretation->modalities))
            ->onWeekdays($interpretation->weekdays)
            ->matchingKeywords($terms)
            ->with(['community', 'category', 'modality', 'location'])
            ->withCount('activeRegistrations')
            ->orderBy('starts_at')
            ->orderBy('id')
            ->limit(self::CANDIDATE_LIMIT)
            ->get();

        return $events
            ->map(fn (Event $event) => [
                'event' => $event,
                ...$this->explainEvent($event, $interpretation),
            ])
            ->sortByDesc('score')
            ->take(self::EVENT_LIMIT)
            ->map(fn (array $match) => ['event' => $match['event'], 'reasons' => $match['reasons']])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $terms
     * @return array<int, array{community: Community, reasons: array<int, string>}>
     */
    private function communities(DiscoveryInterpretation $interpretation, array $terms): array
    {
        if ($terms === []) {
            return [];
        }

        return Community::query()
            ->where('is_active', true)
            ->matchingKeywords($terms)
            ->withCount(['events as upcoming_events_count' => fn (Builder $query) => $query->publiclyListed()])
            ->orderBy('name')
            ->limit(self::CANDIDATE_LIMIT)
            ->get()
            ->map(fn (Community $community) => ['community' => $community, ...$this->explainCommunity($community, $interpretation)])
            ->sortBy([['score', 'desc'], ['community.upcoming_events_count', 'desc']])
            ->take(self::COMMUNITY_LIMIT)
            ->map(fn (array $match) => ['community' => $match['community'], 'reasons' => $match['reasons']])
            ->values()
            ->all();
    }

    /**
     * @return array{score: int, reasons: array<int, string>}
     */
    private function explainEvent(Event $event, DiscoveryInterpretation $interpretation): array
    {
        $matches = $this->matchesByField($interpretation->keywords, [
            'title' => [$event->title],
            'description' => [$event->description],
            'community' => [$event->community->name, $event->community->description],
        ]);

        $score = 3 * count($matches['title']) + 2 * count($matches['description']) + count($matches['community']);
        $reasons = array_values(array_filter([
            $matches['title'] === [] ? null : 'El título menciona '.$this->quoteList($matches['title']).'.',
            $matches['description'] === [] ? null : 'La descripción menciona '.$this->quoteList($matches['description']).'.',
            $matches['community'] === [] ? null
                : "Lo organiza {$event->community->name}, que trabaja con ".$this->quoteList($matches['community']).'.',
        ]));

        if ($interpretation->categories !== []) {
            $reasons[] = "Es de tipo {$event->category->name}, como pediste.";
        }

        if ($interpretation->modalities !== []) {
            $reasons[] = 'Modalidad '.Str::lower($event->modality->name).', como pediste.';
        }

        $startsAt = $event->starts_at->copy()->setTimezone(Event::LOCAL_TIMEZONE)->locale('es');
        $reasons[] = 'Es el '.$startsAt->translatedFormat('l j \d\e F').' a las '.$startsAt->format('H:i')
            .' (hora de Guayaquil)'.($interpretation->weekdays !== [] ? ', un día que pediste.' : '.');

        $seats = $event->available_capacity;
        $reasons[] = $seats === 1 ? 'Queda 1 cupo disponible.' : "Quedan {$seats} cupos disponibles.";

        return ['score' => $score, 'reasons' => $reasons];
    }

    /**
     * @return array{score: int, reasons: array<int, string>}
     */
    private function explainCommunity(Community $community, DiscoveryInterpretation $interpretation): array
    {
        $matches = $this->matchesByField($interpretation->keywords, [
            'name' => [$community->name],
            'description' => [$community->description],
        ]);

        $score = 2 * count($matches['name']) + count($matches['description']);
        $reasons = array_values(array_filter([
            $matches['name'] === [] ? null : 'Su nombre menciona '.$this->quoteList($matches['name']).'.',
            $matches['description'] === [] ? null : 'Su descripción menciona '.$this->quoteList($matches['description']).'.',
        ]));

        $count = (int) $community->upcoming_events_count;
        $reasons[] = match ($count) {
            0 => 'Por ahora no tiene eventos próximos publicados.',
            1 => 'Tiene 1 evento próximo publicado.',
            default => "Tiene {$count} eventos próximos publicados.",
        };

        return ['score' => $score, 'reasons' => $reasons];
    }

    /**
     * Attributes each keyword to the first field, in the given order, whose
     * texts mention it, and returns how it appears there.
     *
     * @param  array<int, string>  $keywords
     * @param  array<string, array<int, ?string>>  $fields
     * @return array<string, array<int, string>>
     */
    private function matchesByField(array $keywords, array $fields): array
    {
        $matches = array_map(fn () => [], $fields);

        foreach ($keywords as $keyword) {
            foreach ($fields as $field => $texts) {
                $found = collect($texts)->flatMap(fn (?string $text) => $this->keywords->matchesIn($keyword, $text))->all();

                if ($found !== []) {
                    $matches[$field] = [...$matches[$field], ...$found];

                    break;
                }
            }
        }

        return $matches;
    }

    /**
     * Formats ["a", "b", "c"] as «a», «b» y «c», listing words that differ
     * only in case or accents once.
     *
     * @param  array<int, string>  $words
     */
    private function quoteList(array $words): string
    {
        $quoted = collect($words)
            ->unique(fn (string $word) => DiscoveryKeywords::fold($word))
            ->map(fn (string $word) => "«{$word}»")
            ->values()
            ->all();
        $last = array_pop($quoted);

        return $quoted === [] ? $last : implode(', ', $quoted).' y '.$last;
    }
}
