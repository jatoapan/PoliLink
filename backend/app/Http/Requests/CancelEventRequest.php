<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }
}
