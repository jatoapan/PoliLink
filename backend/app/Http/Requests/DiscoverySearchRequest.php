<?php

namespace App\Http\Requests;

use App\Services\Discovery\DiscoveryInterpreter;
use App\Services\Discovery\DiscoveryScope;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'scope' => ['sometimes', 'string', Rule::enum(DiscoveryScope::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'query.required' => 'Escribe qué te gustaría encontrar.',
            'query.string' => 'La búsqueda debe ser un texto.',
            'query.min' => 'La búsqueda debe tener al menos 3 caracteres.',
            'query.max' => 'La búsqueda no puede superar los 300 caracteres.',
            'scope.string' => 'El alcance de la búsqueda no es válido.',
            'scope.enum' => 'El alcance de la búsqueda no es válido.',
        ];
    }

    public function discoveryScope(): DiscoveryScope
    {
        return DiscoveryScope::from($this->validated('scope', DiscoveryScope::All->value));
    }
}
