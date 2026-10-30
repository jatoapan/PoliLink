<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'registered_at' => $this->registered_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'status' => [
                'code' => $this->status->value,
                'name' => $this->status->label(),
            ],
            'event' => $this->whenLoaded('event', fn () => new EventResource($this->event)),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'first_name' => $this->user->first_name,
                'last_name' => $this->user->last_name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
