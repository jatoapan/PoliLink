<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class PublicImageStorageService
{
    private const DISK = 'public';

    public function store(UploadedFile $image, string $directory): string
    {
        return $image->store($directory, self::DISK);
    }

    public function delete(?string $path): void
    {
        if ($path !== null) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    public function url(?string $path): ?string
    {
        return $path === null ? null : Storage::disk(self::DISK)->url($path);
    }

    public function move(string $path, string $directory): string
    {
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $target = trim($directory, '/').'/'.Str::uuid().($extension ? '.'.$extension : '');

        if (! Storage::disk(self::DISK)->move($path, $target)) {
            throw new RuntimeException('No se pudo mover la imagen almacenada.');
        }

        return $target;
    }

    public function moveTo(string $path, string $target): void
    {
        if (! Storage::disk(self::DISK)->move($path, $target)) {
            throw new RuntimeException('No se pudo restaurar la imagen almacenada.');
        }
    }
}
