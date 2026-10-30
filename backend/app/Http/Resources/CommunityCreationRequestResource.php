<?php

namespace App\Http\Resources;

use App\Services\PublicImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityCreationRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image_url' => app(PublicImageStorageService::class)->url($this->image_path),
            'status' => [
                'code' => $this->status->value,
                'name' => $this->status->label(),
            ],
            'requested_by' => $this->whenLoaded('requester', fn () => [
                'id' => $this->requester->id,
                'first_name' => $this->requester->first_name,
                'last_name' => $this->requester->last_name,
                'email' => $this->requester->email,
            ]),
            'community' => $this->whenLoaded('community', fn () => new CommunityResource($this->community)),
            'requested_at' => $this->created_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'rejection_reason' => $this->rejection_reason,
        ];
    }
}
