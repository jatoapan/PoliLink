<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
                'regex:/^[^@\s]+@espol\.edu\.ec$/i',
            ],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.regex' => 'Debes usar un correo terminado en @espol.edu.ec.',
        ];
    }
}
