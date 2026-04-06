<?php

namespace Modules\CustomersMeetings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignSalespersonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'salesperson_id' => 'required|integer|exists:t_users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'salesperson_id.required' => 'Le commercial est obligatoire',
            'salesperson_id.exists' => 'Le commercial selectionne n\'existe pas',
        ];
    }
}
