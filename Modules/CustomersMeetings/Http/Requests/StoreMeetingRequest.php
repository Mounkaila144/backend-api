<?php

namespace Modules\CustomersMeetings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\Customer\Entities\Customer;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $customer = $this->input('customer');

            if (! $customer) {
                return;
            }

            $phone = $customer['phone'] ?? null;
            $email = $customer['email'] ?? null;

            if (! $phone && ! $email) {
                return;
            }

            $query = Customer::query();

            if ($phone && $email) {
                $query->where('phone', $phone)->where('email', $email);
            } elseif ($phone) {
                $query->where('phone', $phone);
            } else {
                $query->where('email', $email);
            }

            $existing = $query->first();

            if ($existing) {
                $validator->errors()->add(
                    'customer',
                    "Ce client existe deja (#{$existing->id} - {$existing->firstname} {$existing->lastname}, tel: {$existing->phone}, email: {$existing->email})"
                );
            }
        });
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'nullable|integer|exists:t_customers,id',
            'registration' => 'nullable|string|max:255',
            'telepro_id' => 'nullable|integer',
            'sales_id' => 'nullable|integer',
            'sale2_id' => 'nullable|integer',
            'assistant_id' => 'nullable|integer',
            'company_id' => 'nullable|integer',
            'polluter_id' => 'nullable|integer',
            'partner_layer_id' => 'nullable|integer',
            'callcenter_id' => 'nullable|integer',
            'campaign_id' => 'nullable|integer',
            'type_id' => 'nullable|integer',
            'confirmator_id' => 'nullable|integer',
            'status_call_id' => 'nullable|integer',
            'status_lead_id' => 'nullable|integer',

            // Date fields
            'in_at' => 'required|date',
            'out_at' => 'nullable|date|after:in_at',
            'in_at_range_id' => 'nullable|integer',
            'callback_at' => 'nullable|date',
            'opc_at' => 'nullable|date',
            'creation_at' => 'nullable|date',

            'state_id' => 'nullable|integer|exists:t_customers_meeting_status,id',
            'opc_range_id' => 'nullable|integer',

            'remarks' => 'nullable|string',
            'sale_comments' => 'nullable|string',
            'turnover' => 'nullable|numeric|min:0',
            'variables' => 'nullable|json',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'is_confirmed' => 'nullable|in:YES,NO',
            'is_hold' => 'nullable|in:YES,NO',
            'is_hold_quote' => 'nullable|in:YES,NO',
            'is_qualified' => 'nullable|in:YES,NO',

            // Customer information (nested)
            'customer' => 'required|array',
            'customer.lastname' => 'required|string|max:255',
            'customer.firstname' => 'required|string|max:255',
            'customer.phone' => 'required|string|max:20',
            'customer.email' => 'nullable|string|email|max:255',
            'customer.mobile' => 'nullable|string|max:128',
            'customer.mobile2' => 'nullable|string|max:20',
            'customer.gender' => 'nullable|in:Mr,Ms,Mrs',
            'customer.company' => 'nullable|string|max:255',
            'customer.union_id' => 'nullable|integer|exists:t_customers_union,id',

            // Address information (nested)
            'customer.address' => 'required|array',
            'customer.address.address1' => 'required|string|max:255',
            'customer.address.postcode' => 'required|string|max:10',
            'customer.address.city' => 'required|string|max:255',

            // Products
            'products' => 'nullable|array',
            'products.*.product_id' => 'nullable|integer|exists:t_products,id',
            'products.*.details' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'in_at.required' => 'La date du rendez-vous est obligatoire',
            'in_at.date' => 'La date du rendez-vous doit etre une date valide',
            'out_at.after' => 'La date de fin doit etre superieure a la date de debut',
            'state_id.exists' => 'Le statut selectionne n\'existe pas',
            'customer.required' => 'Les informations du client sont obligatoires',
            'customer.lastname.required' => 'Le nom de famille du client est obligatoire',
            'customer.firstname.required' => 'Le prenom du client est obligatoire',
            'customer.phone.required' => 'Le numero de telephone est obligatoire',
            'customer.address.required' => 'L\'adresse du client est obligatoire',
            'customer.address.address1.required' => 'L\'adresse (ligne 1) est obligatoire',
            'customer.address.postcode.required' => 'Le code postal est obligatoire',
            'customer.address.city.required' => 'La ville est obligatoire',
            'products.array' => 'Les produits doivent etre un tableau',
            'products.*.product_id.exists' => 'Le produit selectionne n\'existe pas',
        ];
    }
}
