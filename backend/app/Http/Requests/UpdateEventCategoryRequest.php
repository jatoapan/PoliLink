<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventCategoryRequest extends FormRequest
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
                Rule::unique('event_categories', 'name')->ignore($this->route('eventCategory')),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
