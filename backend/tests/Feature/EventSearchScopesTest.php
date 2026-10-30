<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\Community;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventModality;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventSearchScopesTest extends TestCase
{
    use RefreshDatabase;

    public function test_publicly_listed_scope_excludes_cancelled_past_and_inactive_community_events(): void
    {
        $listed = $this->event(['title' => 'Publicado futuro']);
        $this->event(['title' => 'Cancelado', 'status' => EventStatus::Cancelled->value]);
        $this->event(['title' => 'Pasado', 'starts_at' => now()->subMinute()]);
        $this->event([
            'title' => 'Comunidad inactiva',
            'community_id' => Community::factory()->create(['is_active' => false])->id,
        ]);

        $this->assertSame([$listed->id], Event::query()->publiclyListed()->pluck('id')->all());
    }

    public function test_category_and_modality_scopes_filter_by_any_of_the_given_codes(): void
    {
        $workshop = EventCategory::factory()->create(['code' => 'workshop']);
        $talk = EventCategory::factory()->create(['code' => 'talk']);
        $fair = EventCategory::factory()->create(['code' => 'fair']);
        $inPerson = EventModality::factory()->create(['code' => 'in_person']);
        $virtual = EventModality::factory()->create(['code' => 'virtual']);

        $workshopInPerson = $this->event(['event_category_id' => $workshop->id, 'event_modality_id' => $inPerson->id]);
        $talkVirtual = $this->event(['event_category_id' => $talk->id, 'event_modality_id' => $virtual->id]);
        $this->event(['event_category_id' => $fair->id, 'event_modality_id' => $inPerson->id]);

        $this->assertEqualsCanonicalizing(
            [$workshopInPerson->id, $talkVirtual->id],
            Event::query()->inCategories(['workshop', 'talk'])->pluck('id')->all(),
        );
        $this->assertSame(
            [$workshopInPerson->id],
            Event::query()->inCategories(['workshop', 'talk'])->inModalities(['in_person'])->pluck('id')->all(),
        );
        $this->assertSame([], Event::query()->inCategories(['unknown'])->pluck('id')->all());
    }

    public function test_keyword_scope_matches_event_and_community_text(): void
    {
        $byTitle = $this->event(['title' => 'Taller de Python']);
        $byDescription = $this->event(['description' => 'Programaremos en Python juntos.']);
        $byCommunityName = $this->event([
            'community_id' => $this->community(['name' => 'Club Python ESPOL'])->id,
        ]);
        $byCommunityDescription = $this->event([
            'community_id' => $this->community(['description' => 'Personas que programan en Python.'])->id,
        ]);
        $this->event(['title' => 'Torneo de ajedrez']);

        $this->assertEqualsCanonicalizing(
            [$byTitle->id, $byDescription->id, $byCommunityName->id, $byCommunityDescription->id],
            Event::query()->matchingKeywords(['python'])->pluck('id')->all(),
        );
        $this->assertSame([], Event::query()->matchingKeywords(['robótica'])->pluck('id')->all());
    }

    public function test_keyword_scope_matches_any_keyword_and_ignores_blank_ones(): void
    {
        $python = $this->event(['title' => 'Taller de Python']);
        $robotics = $this->event(['title' => 'Charla de robótica']);
        $this->event(['title' => 'Torneo de ajedrez']);

        $this->assertEqualsCanonicalizing(
            [$python->id, $robotics->id],
            Event::query()->matchingKeywords(['PYTHON', '  ', 'robótica', null, 7])->pluck('id')->all(),
        );
        $this->assertSame(3, Event::query()->matchingKeywords(['', '   '])->count());
        $this->assertSame(3, Event::query()->matchingKeywords([])->count());
    }

    public function test_keyword_scope_uses_at_most_the_configured_number_of_keywords(): void
    {
        $lastKeyword = $this->event(['title' => 'Evento de robótica']);
        $keywords = [...array_map(fn (int $index) => "inexistente{$index}", range(1, Event::MAX_SEARCH_KEYWORDS)), 'robótica'];

        $this->assertFalse(Event::query()->matchingKeywords($keywords)->whereKey($lastKeyword->id)->exists());
    }

    public function test_keyword_scope_matches_special_characters_literally(): void
    {
        $percent = $this->event(['title' => 'Taller 100% práctico']);
        $underscore = $this->event(['title' => 'Variables snake_case en Python']);
        $exclamation = $this->event(['title' => '¡Hola mundo!']);
        $this->event(['title' => 'Charla para 1000 asistentes']);
        $this->event(['title' => 'Estilo snakexcase']);

        $this->assertSame([$percent->id], Event::query()->matchingKeywords(['100%'])->pluck('id')->all());
        $this->assertSame([$percent->id], Event::query()->matchingKeywords(['%'])->pluck('id')->all());
        $this->assertSame([$underscore->id], Event::query()->matchingKeywords(['snake_case'])->pluck('id')->all());
        $this->assertSame([$underscore->id], Event::query()->matchingKeywords(['_'])->pluck('id')->all());
        $this->assertSame([$exclamation->id], Event::query()->matchingKeywords(['mundo!'])->pluck('id')->all());
        $this->assertSame([], Event::query()->matchingKeywords(["' OR 1=1 --"])->pluck('id')->all());
        $this->assertSame(5, Event::query()->count());
    }

    public function test_keyword_scope_combined_with_catalog_visibility_skips_unlisted_events(): void
    {
        $listed = $this->event(['title' => 'Taller de Python']);
        $this->event(['title' => 'Python cancelado', 'status' => EventStatus::Cancelled->value]);
        $this->event(['title' => 'Python pasado', 'starts_at' => now()->subDay()]);
        $this->event([
            'title' => 'Python en comunidad inactiva',
            'community_id' => $this->community(['is_active' => false])->id,
        ]);

        $this->assertSame(4, Event::query()->matchingKeywords(['python'])->count());
        $this->assertSame(
            [$listed->id],
            Event::query()->publiclyListed()->matchingKeywords(['python'])->pluck('id')->all(),
        );
    }

    private function event(array $attributes = []): Event
    {
        return Event::factory()->create([
            'community_id' => fn () => $this->community()->id,
            'status' => EventStatus::Published->value,
            'title' => 'Evento sin coincidencias',
            'description' => 'Descripción neutra.',
            'starts_at' => now()->addDays(3),
            ...$attributes,
        ]);
    }

    private function community(array $attributes = []): Community
    {
        static $sequence = 0;
        $sequence++;

        return Community::factory()->create([
            'name' => "Comunidad {$sequence}",
            'slug' => "comunidad-{$sequence}",
            'description' => 'Comunidad neutra.',
            ...$attributes,
        ]);
    }
}
