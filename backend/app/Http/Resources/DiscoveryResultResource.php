<?php

namespace App\Http\Resources;

use App\Services\Discovery\DiscoveryResult;
use App\Services\Discovery\DiscoveryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property DiscoveryResult $resource
 */
class DiscoveryResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $result = $this->resource;
        $interpretation = $result->interpretation;

        return [
            'mode' => $interpretation->mode,
            'scope' => $result->scope->value,
            'fallback_reason' => $interpretation->fallbackReason?->value,
            'interpretation' => [
                'intent' => $interpretation->intent,
                'keywords' => $interpretation->keywords,
                'categories' => collect($interpretation->categories)
                    ->map(fn (string $code) => ['code' => $code, 'name' => $result->categoryNames[$code] ?? $code])
                    ->all(),
                'modalities' => collect($interpretation->modalities)
                    ->map(fn (string $code) => ['code' => $code, 'name' => $result->modalityNames[$code] ?? $code])
                    ->all(),
                'weekdays' => collect($interpretation->weekdays)
                    ->map(fn (int $weekday) => ['iso' => $weekday, 'name' => DiscoveryService::WEEKDAY_NAMES[$weekday]])
                    ->all(),
            ],
            'events' => collect($result->events)
                ->map(fn (array $match) => [
                    ...(new EventResource($match['event']))->resolve($request),
                    'reasons' => $match['reasons'],
                ])
                ->all(),
            'communities' => collect($result->communities)
                ->map(fn (array $match) => [
                    ...(new CommunityResource($match['community']))->resolve($request),
                    'upcoming_events_count' => (int) $match['community']->upcoming_events_count,
                    'reasons' => $match['reasons'],
                ])
                ->all(),
        ];
    }
}
