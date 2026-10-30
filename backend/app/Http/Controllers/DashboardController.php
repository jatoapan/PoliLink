<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListOrganizerEventsRequest;
use App\Http\Resources\CommunityResource;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function communities(Request $request)
    {
        return CommunityResource::collection(
            $request->user()->managedMemberships()
                ->with('community')
                ->get()
                ->pluck('community')
                ->sortBy('name')
                ->values(),
        );
    }

    public function events(ListOrganizerEventsRequest $request)
    {
        $managedCommunityIds = $request->user()->managedMemberships()->pluck('community_id');

        $events = Event::query()
            ->whereIn('community_id', $managedCommunityIds)
            ->with($this->eventRelations())
            ->withCount('activeRegistrations')
            ->orderByDesc('starts_at')
            ->paginate($request->validated('per_page', 12))
            ->withQueryString();

        return EventResource::collection($events);
    }

    /**
     * @return array<int, string>
     */
    private function eventRelations(): array
    {
        return [
            'community',
            'category',
            'modality',
            'location',
        ];
    }
}
