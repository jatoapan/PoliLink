<?php

namespace App\Services\Discovery;

use App\Services\Gemma\GemmaFailure;

/**
 * Structured, validated filters extracted from a natural-language query.
 */
final readonly class DiscoveryInterpretation
{
    public const INTENT_EVENTS = 'events';

    public const INTENT_COMMUNITIES = 'communities';

    public const INTENT_BOTH = 'both';

    public const INTENTS = [self::INTENT_EVENTS, self::INTENT_COMMUNITIES, self::INTENT_BOTH];

    public const MODE_AI = 'ai';

    public const MODE_FALLBACK = 'fallback';

    /**
     * @param  array<int, string>  $keywords
     * @param  array<int, string>  $categories
     * @param  array<int, string>  $modalities
     * @param  array<int, int>  $weekdays
     */
    public function __construct(
        public string $intent,
        public array $keywords,
        public array $categories,
        public array $modalities,
        public array $weekdays,
        public string $mode,
        public ?GemmaFailure $fallbackReason = null,
    ) {}
}
