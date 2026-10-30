<?php

namespace App\Services\Discovery;

use App\Services\Gemma\GemmaFailure;

/**
 * Deterministic interpretation used when Gemma is unavailable or returns
 * unusable output. It only recognizes fixed Spanish vocabulary.
 */
class RuleBasedDiscoveryInterpreter
{
    /** Accent-folded phrases that map to ISO weekdays. */
    private const WEEKDAY_PHRASES = [
        'fines de semana' => [6, 7],
        'fin de semana' => [6, 7],
        'entre semana' => [1, 2, 3, 4, 5],
    ];

    private const WEEKDAY_WORDS = [
        'lunes' => 1, 'martes' => 2, 'miercoles' => 3, 'jueves' => 4, 'viernes' => 5,
        'sabado' => 6, 'sabados' => 6, 'domingo' => 7, 'domingos' => 7,
    ];

    private const MODALITY_PHRASES = [
        'en persona' => 'in_person',
        'en linea' => 'virtual',
    ];

    private const MODALITY_WORDS = [
        'presencial' => 'in_person', 'presenciales' => 'in_person',
        'virtual' => 'virtual', 'virtuales' => 'virtual', 'online' => 'virtual',
        'remoto' => 'virtual', 'remota' => 'virtual', 'remotos' => 'virtual', 'remotas' => 'virtual',
        'hibrido' => 'hybrid', 'hibrida' => 'hybrid', 'hibridos' => 'hybrid', 'hibridas' => 'hybrid',
    ];

    private const CATEGORY_WORDS = [
        'taller' => 'workshop', 'talleres' => 'workshop', 'workshop' => 'workshop', 'workshops' => 'workshop',
        'charla' => 'talk', 'charlas' => 'talk', 'conferencia' => 'talk', 'conferencias' => 'talk', 'ponencia' => 'talk',
        'hackaton' => 'hackathon', 'hackatones' => 'hackathon', 'hackathon' => 'hackathon', 'hackathons' => 'hackathon',
        'feria' => 'fair', 'ferias' => 'fair',
        'cultural' => 'cultural', 'culturales' => 'cultural',
        'deporte' => 'sports', 'deportes' => 'sports', 'deportivo' => 'sports', 'deportiva' => 'sports',
        'deportivos' => 'sports', 'deportivas' => 'sports',
    ];

    private const COMMUNITY_WORDS = [
        'comunidad', 'comunidades', 'club', 'clubes', 'grupo', 'grupos', 'gente', 'personas',
        'conocer', 'unirme', 'miembros', 'companeros',
    ];

    private const EVENT_WORDS = ['evento', 'eventos', 'actividad', 'actividades'];

    public function __construct(
        private readonly DiscoveryKeywords $keywords,
    ) {}

    /**
     * @param  array<string, string>  $categories  active category names keyed by code
     * @param  array<string, string>  $modalities  active modality names keyed by code
     */
    public function interpret(string $query, array $categories, array $modalities, GemmaFailure $reason): DiscoveryInterpretation
    {
        $folded = ' '.preg_replace('/[^a-z0-9+#]+/', ' ', DiscoveryKeywords::fold($query)).' ';
        $weekdays = [];
        $foundModalities = [];
        $consumed = [];

        foreach (self::WEEKDAY_PHRASES as $phrase => $days) {
            if (str_contains($folded, " {$phrase} ")) {
                $weekdays = [...$weekdays, ...$days];
                $consumed = [...$consumed, ...explode(' ', $phrase)];
            }
        }

        foreach (self::MODALITY_PHRASES as $phrase => $code) {
            if (str_contains($folded, " {$phrase} ")) {
                $foundModalities[] = $code;
                $consumed = [...$consumed, ...explode(' ', $phrase)];
            }
        }

        $categoryWords = [
            ...self::CATEGORY_WORDS,
            ...collect($categories)->mapWithKeys(fn (string $name, string $code) => [DiscoveryKeywords::fold($name) => $code])->all(),
        ];
        $foundCategories = [];
        $mentionsCommunities = false;
        $mentionsEvents = false;
        $keywords = [];

        foreach (preg_split('/[^\pL\pN+#]+/u', mb_strtolower($query), -1, PREG_SPLIT_NO_EMPTY) as $word) {
            $foldedWord = DiscoveryKeywords::fold($word);

            if (isset(self::WEEKDAY_WORDS[$foldedWord])) {
                $weekdays[] = self::WEEKDAY_WORDS[$foldedWord];
            } elseif (isset(self::MODALITY_WORDS[$foldedWord])) {
                $foundModalities[] = self::MODALITY_WORDS[$foldedWord];
            } elseif (isset($categoryWords[$foldedWord])) {
                $foundCategories[] = $categoryWords[$foldedWord];
            } elseif (in_array($foldedWord, self::COMMUNITY_WORDS, true)) {
                $mentionsCommunities = true;
            } elseif (in_array($foldedWord, self::EVENT_WORDS, true)) {
                $mentionsEvents = true;
            } elseif (! in_array($foldedWord, $consumed, true) && ! $this->keywords->isFiller($foldedWord)) {
                $keywords[] = $word;
            }
        }

        $foundCategories = array_values(array_unique(array_intersect($foundCategories, array_keys($categories))));
        $foundModalities = array_values(array_unique(array_intersect($foundModalities, array_keys($modalities))));
        $mentionsEvents = $mentionsEvents || $foundCategories !== [] || $foundModalities !== [] || $weekdays !== [];

        return new DiscoveryInterpretation(
            intent: match (true) {
                $mentionsCommunities && $mentionsEvents => DiscoveryInterpretation::INTENT_BOTH,
                $mentionsCommunities => DiscoveryInterpretation::INTENT_COMMUNITIES,
                default => DiscoveryInterpretation::INTENT_EVENTS,
            },
            keywords: $this->keywords->normalize($keywords),
            categories: $foundCategories,
            modalities: $foundModalities,
            weekdays: collect($weekdays)->unique()->sort()->values()->all(),
            mode: DiscoveryInterpretation::MODE_FALLBACK,
            fallbackReason: $reason,
        );
    }
}
