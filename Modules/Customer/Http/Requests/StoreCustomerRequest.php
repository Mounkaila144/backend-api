<?php

namespace Modules\Customer\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'company' => 'nullable|string|max:255',
            'gender' => 'nullable|in:Mr,Ms,Mrs',
            'firstname' => 'nullable|string|max:128',
            'lastname' => 'nullable|string|max:128',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:128',
            'mobile2' => 'nullable|string|max:20',
            'phone1' => 'nullable|string|max:20',
            'birthday' => 'nullable|date',
            'union_id' => 'nullable|integer|exists:t_customers_union,id',
            'age' => 'nullable|string|max:40',
            'salary' => 'nullable|string|max:40',
            'occupation' => 'nullable|string|max:40',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'email.required' => 'L\'adresse e-mail est obligatoire',
            'email.email' => 'L\'adresse e-mail doit être valide',
            'gender.in' => 'Le genre doit être Mr, Ms ou Mrs',
            'union_id.exists' => 'L\'union sélectionnée n\'existe pas',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'company' => 'entreprise',
            'gender' => 'genre',
            'firstname' => 'prénom',
            'lastname' => 'nom',
            'email' => 'e-mail',
            'phone' => 'téléphone',
            'mobile' => 'mobile',
            'birthday' => 'date de naissance',
            'occupation' => 'profession',
        ];
    }
}
