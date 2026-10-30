<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CommunitySlugService
{
    public function fromName(string $name): string
    {
        $slug = Str::slug($name);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'name' => 'El nombre debe producir un identificador válido para la comunidad.',
            ]);
        }

        return $slug;
    }
}
