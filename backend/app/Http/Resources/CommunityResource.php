<?php

namespace App\Http\Resources;

use App\Services\PublicImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image_url' => app(PublicImageStorageService::class)->url($this->image_path),
        ];
    }
}
