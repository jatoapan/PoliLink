<?php

namespace App\Services\Discovery;

/**
 * Which result types a discovery search returns: the discovery page asks for
 * both, while the event catalog and the community directory ask for one.
 */
enum DiscoveryScope: string
{
    case All = 'all';
    case Events = 'events';
    case Communities = 'communities';

    public function includesEvents(): bool
    {
        return $this !== self::Communities;
    }

    public function includesCommunities(): bool
    {
        return $this !== self::Events;
    }
}
