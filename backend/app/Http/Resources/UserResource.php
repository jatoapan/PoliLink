<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'is_admin' => (bool) $this->is_admin,
            'community_memberships' => $this->whenLoaded('memberships', fn () => $this->memberships
                ->sortBy(fn ($membership) => $membership->community?->name)
                ->values()
                ->map(fn ($membership) => [
                    'community' => [
                        'id' => $membership->community->id,
                        'name' => $membership->community->name,
                        'slug' => $membership->community->slug,
                    ],
                    'role' => [
                        'code' => $membership->role->code,
                        'name' => $membership->role->name,
                    ],
                    'status' => [
                        'code' => $membership->status->value,
                        'name' => $membership->status->label(),
                    ],
                    'requested_at' => $membership->requested_at?->toISOString(),
                    'reviewed_at' => $membership->reviewed_at?->toISOString(),
                ])),
        ];
    }
}
