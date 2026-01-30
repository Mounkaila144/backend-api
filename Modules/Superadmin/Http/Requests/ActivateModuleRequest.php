<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ActivateModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'config' => ['nullable', 'array'],
        ];
    }
}
