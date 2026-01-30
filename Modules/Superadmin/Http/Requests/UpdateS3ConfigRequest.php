<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateS3ConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'access_key' => ['required', 'string'],
            'secret_key' => ['required', 'string'],
            'bucket' => ['required', 'string'],
            'region' => ['required', 'string'],
            'endpoint' => ['nullable', 'url'],
            'use_path_style' => ['nullable', 'boolean'],
        ];
    }
}
