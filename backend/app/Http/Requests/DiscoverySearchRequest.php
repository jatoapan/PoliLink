<?php

namespace App\Http\Requests;

use App\Services\Discovery\DiscoveryInterpreter;
use Illuminate\Foundation\Http\FormRequest;

class DiscoverySearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:3', 'max:'.DiscoveryInterpreter::MAX_QUERY_LENGTH],
        ];
    }

    public function messages(): array
    {
        return [
            'query.required' => 'Escribe qué te gustaría encontrar.',
            'query.string' => 'La búsqueda debe ser un texto.',
            'query.min' => 'La búsqueda debe tener al menos 3 caracteres.',
            'query.max' => 'La búsqueda no puede superar los 300 caracteres.',
        ];
    }
}
