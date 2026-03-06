<?php

namespace Modules\CustomersContracts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Contract Request Validation
 */
class UpdateContractRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Adjust based on your authorization logic
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $contractId = $this->route('id');

        return [
            'reference' => 'nullable|string|max:255|unique:t_customers_contract,reference,'.$contractId,
            'customer_id' => 'nullable|integer|exists:t_customers,id',
            'meeting_id' => 'nullable|integer|exists:t_customers_meeting,id',
            'financial_partner_id' => 'nullable|integer',
            'tax_id' => 'nullable|integer',
            'team_id' => 'nullable|integer',
            'telepro_id' => 'nullable|integer',
            'sale_1_id' => 'nullable|integer',
            'sale_2_id' => 'nullable|integer',
            'manager_id' => 'nullable|integer',
            'assistant_id' => 'nullable|integer',
            'installer_user_id' => 'nullable|integer|exists:t_users,id',
            'polluter_id' => 'nullable|integer',
            'partner_layer_id' => 'nullable|integer',
            'campaign_id' => 'nullable|integer',
            'opc_status_id' => 'nullable|integer',
            'time_state_id' => 'nullable|integer',

            // Date fields (only mandatory during update if provided)
            'quoted_at' => 'nullable|date',
            'billing_at' => 'nullable|date',
            'opc_at' => 'nullable|date',
            'opened_at' => 'nullable|date|after:quoted_at',
            'sent_at' => 'nullable|date',
            'payment_at' => 'nullable|date',
            'apf_at' => 'nullable|date',
            'sav_at' => 'nullable|date',
            'pre_meeting_at' => 'nullable|date',
            'doc_at' => 'nullable|date',
            'closed_at' => 'nullable|date',
            'signed_at' => 'nullable|date',

            'opened_at_range_id' => 'nullable|integer',
            'opc_range_id' => 'nullable|integer',
            'sav_at_range_id' => 'nullable|integer',
            'state_id' => 'nullable|integer|exists:t_customers_contracts_status,id',
            'install_state_id' => 'nullable|integer|exists:t_customers_contracts_install_status,id',
            'admin_status_id' => 'nullable|integer|exists:t_customers_contracts_admin_status,id',
            'total_price_with_taxe' => 'nullable|numeric|min:0',
            'total_price_without_taxe' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
            'variables' => 'nullable|json',
            'is_signed' => 'nullable|in:YES,NO',
            'is_confirmed' => 'nullable|in:YES,NO',
            'is_hold' => 'nullable|in:YES,NO',
            'is_hold_admin' => 'nullable|in:YES,NO',
            'is_hold_quote' => 'nullable|in:YES,NO',
            'is_billable' => 'nullable|in:YES,NO',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'company_id' => 'nullable|integer',
            'mensuality' => 'nullable|numeric|min:0',
            'advance_payment' => 'nullable|numeric|min:0',

            // Customer information (nested structure) - optional for update
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

            // Address information (nested structure) - optional for update
            'customer.address' => 'nullable|array',
            'customer.address.address1' => 'required_with:customer.address|string|max:255',
            'customer.address.postcode' => 'required_with:customer.address|string|max:10',
            'customer.address.city' => 'required_with:customer.address|string|max:255',

            // Products (if updating)
            'products' => 'nullable|array',
            'products.*.product_id' => 'nullable|integer|exists:t_products,id',
            'products.*.details' => 'nullable|string|max:255',

            // ISO (Domoprime) data
            'iso' => 'nullable|array',
            'iso.energy_id' => 'nullable|integer',
            'iso.pricing_id' => 'nullable|integer',
            'iso.occupation_id' => 'nullable|integer',
            'iso.layer_type_id' => 'nullable|integer',
            'iso.previous_energy_id' => 'nullable|integer',
            'iso.revenue' => 'nullable|numeric|min:0',
            'iso.number_of_people' => 'nullable|numeric|min:0',
            'iso.number_of_children' => 'nullable|numeric|min:0',
            'iso.number_of_fiscal' => 'nullable|numeric|min:0',
            'iso.number_of_parts' => 'nullable|numeric|min:0',
            'iso.surface_home' => 'nullable|numeric|min:0',
            'iso.surface_wall' => 'nullable|numeric|min:0',
            'iso.surface_top' => 'nullable|numeric|min:0',
            'iso.surface_floor' => 'nullable|numeric|min:0',
            'iso.surface_ite' => 'nullable|numeric|min:0',
            'iso.parcel_surface' => 'nullable|numeric|min:0',
            'iso.parcel_reference' => 'nullable|string|max:255',
            'iso.boiler_quantity' => 'nullable|numeric|min:0',
            'iso.pack_quantity' => 'nullable|numeric|min:0',
            'iso.packboiler_quantity' => 'nullable|numeric|min:0',
            'iso.ana_prime' => 'nullable|numeric|min:0',
            'iso.declarants' => 'nullable|string|max:255',
            'iso.more_2_years' => 'nullable|in:YES,NO',
            'iso.build_year' => 'nullable|string|max:4',
            'iso.energy_class' => 'nullable|string|max:10',
            'iso.previous_energy_class' => 'nullable|string|max:10',
            'iso.has_bbc' => 'nullable|in:Y,N',
            'iso.has_strainer' => 'nullable|in:Y,N',
            'iso.tax_credit_used' => 'nullable|numeric|min:0',
            'iso.install_surface_wall' => 'nullable|numeric|min:0',
            'iso.install_surface_top' => 'nullable|numeric|min:0',
            'iso.install_surface_floor' => 'nullable|numeric|min:0',

            // Fiscal verification data
            'verif' => 'nullable|array',
            'verif.*.reference' => 'nullable|string|max:255',
            'verif.*.number' => 'nullable|string|max:255',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            // Reference
            'reference.unique' => 'Cette référence de contrat existe déjà',

            // Customer ID
            'customer_id.exists' => 'Le client sélectionné n\'existe pas',

            // Date fields
            'quoted_at.date' => 'La date de devis doit être une date valide',
            'billing_at.date' => 'La date de facturation doit être une date valide',
            'opc_at.date' => 'La date OPC doit être une date valide',
            'opened_at.date' => 'La date d\'engagement doit être une date valide',
            'opened_at.after' => 'La date d\'engagement doit être supérieure à la date de devis',

            // Status
            'state_id.exists' => 'Le statut sélectionné n\'existe pas',

            // Prices
            'total_price_with_taxe.numeric' => 'Le prix total TTC doit être un nombre',
            'total_price_with_taxe.min' => 'Le prix total TTC doit être supérieur ou égal à 0',
            'total_price_without_taxe.numeric' => 'Le prix total HT doit être un nombre',
            'total_price_without_taxe.min' => 'Le prix total HT doit être supérieur ou égal à 0',

            // Customer information
            'customer.array' => 'Les informations du client doivent être un objet',
            'customer.lastname.required_with' => 'Le nom de famille du client est obligatoire',
            'customer.lastname.max' => 'Le nom de famille ne doit pas dépasser 255 caractères',
            'customer.firstname.required_with' => 'Le prénom du client est obligatoire',
            'customer.firstname.max' => 'Le prénom ne doit pas dépasser 255 caractères',
            'customer.phone.required_with' => 'Le numéro de téléphone est obligatoire',
            'customer.phone.max' => 'Le numéro de téléphone ne doit pas dépasser 20 caractères',
            'customer.email.email' => 'L\'adresse e-mail doit être valide',
            'customer.email.max' => 'L\'adresse e-mail ne doit pas dépasser 255 caractères',
            'customer.mobile.max' => 'Le portable 1 ne doit pas dépasser 20 caractères',
            'customer.mobile2.max' => 'Le portable 2 ne doit pas dépasser 20 caractères',
            'customer.company.max' => 'Le nom de la société ne doit pas dépasser 255 caractères',
            'customer.gender.in' => 'Le genre doit être Mr, Ms ou Mrs',

            // Address information
            'customer.address.array' => 'L\'adresse doit être un objet',
            'customer.address.address1.required_with' => 'L\'adresse (ligne 1) est obligatoire',
            'customer.address.address1.max' => 'L\'adresse ne doit pas dépasser 255 caractères',
            'customer.address.postcode.required_with' => 'Le code postal est obligatoire',
            'customer.address.postcode.max' => 'Le code postal ne doit pas dépasser 10 caractères',
            'customer.address.city.required_with' => 'La ville est obligatoire',
            'customer.address.city.max' => 'La ville ne doit pas dépasser 255 caractères',

            // Products
            'products.array' => 'Les produits doivent être un tableau',
            'products.*.product_id.exists' => 'Le produit sélectionné n\'existe pas',
            'products.*.details.max' => 'Les détails du produit ne doivent pas dépasser 255 caractères',
        ];
    }
}
