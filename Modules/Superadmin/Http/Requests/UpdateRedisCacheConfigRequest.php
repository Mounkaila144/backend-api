<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRedisCacheConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'host' => ['required', 'string'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'password' => ['nullable', 'string'],
            'database' => ['nullable', 'integer', 'min:0', 'max:15'],
            'prefix' => ['nullable', 'string', 'regex:/^[a-z0-9_:]+$/i'],
            'ssl' => ['nullable', 'boolean'],
            'tls' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'prefix.regex' => 'Le préfixe ne peut contenir que des lettres, chiffres, underscores et deux-points.',
        ];
    }
}
