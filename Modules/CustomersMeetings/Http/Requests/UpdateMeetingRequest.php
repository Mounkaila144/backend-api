<?php

namespace Modules\CustomersMeetings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isSuperadmin() || $user->hasCredential('meeting_modify'));
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'nullable|integer|exists:t_customers,id',
            'registration' => 'nullable|string|max:255',
            'telepro_id' => 'nullable|integer|exists:t_users,id',
            'sales_id' => 'nullable|integer|exists:t_users,id',
            'sale2_id' => 'nullable|integer|exists:t_users,id',
            'assistant_id' => 'nullable|integer|exists:t_users,id',
            'company_id' => 'nullable|integer',
            'polluter_id' => 'nullable|integer|exists:t_partner_polluter_company,id',
            'partner_layer_id' => 'nullable|integer|exists:t_partner_layer_company,id',
            'callcenter_id' => 'nullable|integer|exists:t_callcenter,id',
            'campaign_id' => 'nullable|integer|exists:t_campaign,id',
            'type_id' => 'nullable|integer|exists:t_customers_meeting_type,id',
            'confirmator_id' => 'nullable|integer|exists:t_users,id',
            'status_call_id' => 'nullable|integer|exists:t_customers_meeting_status_call,id',
            'status_lead_id' => 'nullable|integer|exists:t_customers_meeting_lead_status,id',

            // Date fields
            'in_at' => 'nullable|date',
            'out_at' => 'nullable|date',
            'in_at_range_id' => 'nullable|integer',
            'callback_at' => 'nullable|date',
            'opc_at' => 'nullable|date',
            'creation_at' => 'nullable|date',
            'treated_at' => 'nullable|date',
            'confirmed_at' => 'nullable|date',

            'state_id' => 'nullable|integer|exists:t_customers_meeting_status,id',
            'opc_range_id' => 'nullable|integer',

            'remarks' => 'nullable|string',
            'sale_comments' => 'nullable|string',
            'turnover' => 'nullable|numeric|min:0',
            'variables' => 'nullable|json',
            'status' => 'nullable|in:ACTIVE,DELETE,INPROGRESS',
            'is_confirmed' => 'nullable|in:YES,NO',
            'is_hold' => 'nullable|in:YES,NO',
            'is_hold_quote' => 'nullable|in:YES,NO',
            'is_qualified' => 'nullable|in:YES,NO',
            'is_works_hold' => 'nullable|in:Y,N',

            // Customer information (nested) - optional for update
            'customer' => 'nullable|array',
            'customer.lastname' => 'required_with:customer|string|max:255',
            'customer.firstname' => 'required_with:customer|string|max:255',
            'customer.phone' => 'required_with:customer|string|max:20',
            'customer.email' => 'nullable|email|max:255',
            'customer.mobile' => 'nullable|string|max:20',
            'customer.mobile2' => 'nullable|string|max:20',
            'customer.company' => 'nullable|string|max:255',
            'customer.gender' => 'nullable|string|in:Mr,Ms,Mrs',
            'customer.union_id' => 'nullable|integer|exists:t_customers_union,id',

            // Address information (nested) - optional for update
            'customer.address' => 'nullable|array',
            'customer.address.address1' => 'required_with:customer.address|string|max:255',
            'customer.address.postcode' => 'required_with:customer.address|string|max:10',
            'customer.address.city' => 'required_with:customer.address|string|max:255',

            // Products
            'products' => 'nullable|array',
            'products.*.product_id' => 'nullable|integer|exists:t_products,id',
            'products.*.details' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'in_at.date' => 'La date du rendez-vous doit etre une date valide',
            'state_id.exists' => 'Le statut selectionne n\'existe pas',
            'customer.lastname.required_with' => 'Le nom de famille du client est obligatoire',
            'customer.firstname.required_with' => 'Le prenom du client est obligatoire',
            'customer.phone.required_with' => 'Le numero de telephone est obligatoire',
            'customer.address.address1.required_with' => 'L\'adresse (ligne 1) est obligatoire',
            'customer.address.postcode.required_with' => 'Le code postal est obligatoire',
            'customer.address.city.required_with' => 'La ville est obligatoire',
        ];
    }
}
