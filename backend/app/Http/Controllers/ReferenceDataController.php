<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Http\Resources\CommunityResource;
use App\Http\Resources\EventCategoryResource;
use App\Http\Resources\EventModalityResource;
use App\Http\Resources\LocationResource;
use App\Models\Community;
use App\Models\EventCategory;
use App\Models\EventModality;
use App\Models\Location;

class ReferenceDataController extends Controller
{
    public function categories()
    {
        return EventCategoryResource::collection(
            EventCategory::query()->where('is_active', true)->orderBy('name')->get(),
        );
    }

    public function modalities()
    {
        return EventModalityResource::collection(
            EventModality::query()->where('is_active', true)->orderBy('name')->get(),
        );
    }

    public function locations()
    {
        return LocationResource::collection(
            Location::query()->where('is_active', true)->orderBy('name')->get(),
        );
    }

    public function communities()
    {
        return CommunityResource::collection(
            Community::query()
                ->where('is_active', true)
                ->whereHas('events', fn ($query) => $query->where('status', EventStatus::Published->value))
                ->orderBy('name')
                ->get(),
        );
    }
}
