<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'community_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('communities', 'id')->where('is_active', true),
            ],
            'event_category_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('event_categories', 'id')->where('is_active', true),
            ],
            'event_modality_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('event_modalities', 'id')->where('is_active', true),
            ],
            'location_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('locations', 'id')->where('is_active', true),
            ],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'starts_at' => ['sometimes', 'required', 'date', 'after:now'],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
        ];
    }
}
