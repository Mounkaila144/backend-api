<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMeilisearchConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'url' => ['nullable', 'url'],
            'api_key' => ['nullable', 'string'],
            'index_prefix' => ['nullable', 'string'],
        ];
    }
}
