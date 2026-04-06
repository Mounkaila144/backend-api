<?php

namespace Modules\CustomersMeetings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateTourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'number_of_salespeople' => 'required|integer|min:1|max:20',
            'states' => 'nullable|array',
            'states.*' => 'integer',
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'La date est obligatoire',
            'number_of_salespeople.required' => 'Le nombre de commerciaux est obligatoire',
            'number_of_salespeople.min' => 'Au moins 1 commercial requis',
            'number_of_salespeople.max' => 'Maximum 20 commerciaux',
        ];
    }
}
