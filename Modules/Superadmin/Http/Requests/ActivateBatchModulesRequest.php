<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ActivateBatchModulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'modules' => ['required', 'array', 'min:1'],
            'modules.*' => ['required', 'string'],
            'configs' => ['nullable', 'array'],
            'configs.*' => ['nullable', 'array'],
        ];
    }
}
