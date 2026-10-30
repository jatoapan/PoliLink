<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventModalityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['prohibited'],
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('event_modalities', 'name')->ignore($this->route('eventModality')),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
