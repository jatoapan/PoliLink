<?php

namespace App\Services\Discovery;

use App\Models\Community;
use App\Models\Event;

final readonly class DiscoveryResult
{
    /**
     * @param  array<int, array{event: Event, reasons: array<int, string>}>  $events
     * @param  array<int, array{community: Community, reasons: array<int, string>}>  $communities
     * @param  array<string, string>  $categoryNames
     * @param  array<string, string>  $modalityNames
     */
    public function __construct(
        public DiscoveryInterpretation $interpretation,
        public DiscoveryScope $scope,
        public array $events,
        public array $communities,
        public array $categoryNames,
        public array $modalityNames,
    ) {}
}
