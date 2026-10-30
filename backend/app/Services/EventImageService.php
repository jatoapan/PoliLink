<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class EventImageService
{
    public function __construct(
        private readonly PublicImageStorageService $storage,
    ) {}

    public function store(UploadedFile $image): string
    {
        return $this->storage->store($image, 'events');
    }

    public function delete(?string $path): void
    {
        $this->storage->delete($path);
    }

    public function url(?string $path): ?string
    {
        return $this->storage->url($path);
    }
}
