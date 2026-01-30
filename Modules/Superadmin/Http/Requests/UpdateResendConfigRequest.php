<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateResendConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'api_key' => ['nullable', 'string'],
            'from_address' => ['nullable', 'email'],
            'from_name' => ['nullable', 'string'],
            'reply_to' => ['nullable', 'email'],
            'test_email' => ['nullable', 'email'], // Pour les tests d'envoi
        ];
    }
}
