<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListEventsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'category' => [
                'nullable',
                'string',
                Rule::exists('event_categories', 'code')->where('is_active', true),
            ],
            'modality' => [
                'nullable',
                'string',
                Rule::exists('event_modalities', 'code')->where('is_active', true),
            ],
            'community_id' => [
                'nullable',
                'integer',
                Rule::exists('communities', 'id')->where('is_active', true),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
