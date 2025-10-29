<?php

namespace Modules\CustomersContracts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Store Contract Request Validation
 */
class StoreContractRequest extends FormRequest
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
        return [
            'reference' => 'nullable|string|max:255|unique:t_customers_contract,reference',
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

            // Required date fields (only these are mandatory)
            'quoted_at' => 'required|date',
            'billing_at' => 'required|date',
            'opc_at' => 'required|date',
            'opened_at' => 'required|date|after:quoted_at',

            'opened_at_range_id' => 'nullable|integer',
            'sent_at' => 'nullable|date',
            'payment_at' => 'nullable|date',
            'opc_range_id' => 'nullable|integer',
            'apf_at' => 'nullable|date',
            'state_id' => 'nullable|integer|exists:t_customers_contracts_status,id',
            'install_state_id' => 'nullable|integer|exists:t_customers_contracts_install_status,id',
            'admin_status_id' => 'nullable|integer|exists:t_customers_contracts_admin_status,id',
            'total_price_with_taxe' => 'nullable|numeric|min:0',
            'total_price_without_taxe' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
            'variables' => 'nullable|json',
            'is_signed' => 'nullable|in:YES,NO',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'company_id' => 'nullable|integer',

            // Customer information (nested structure) - only these fields are mandatory
            'customer' => 'required|array',
            'customer.lastname' => 'required|string|max:255',
            'customer.firstname' => 'required|string|max:255',
            'customer.phone' => 'required|string|max:20',
            'customer.union_id' => 'nullable|integer|exists:t_customers_union,id',

            // Address information (nested structure) - only these fields are mandatory
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

            // Date fields (only mandatory fields)
            'quoted_at.required' => 'La date de devis est obligatoire',
            'quoted_at.date' => 'La date de devis doit être une date valide',
            'billing_at.required' => 'La date de facturation est obligatoire',
            'billing_at.date' => 'La date de facturation doit être une date valide',
            'opc_at.required' => 'La date OPC est obligatoire',
            'opc_at.date' => 'La date OPC doit être une date valide',
            'opened_at.required' => 'La date d\'engagement est obligatoire',
            'opened_at.date' => 'La date d\'engagement doit être une date valide',
            'opened_at.after' => 'La date d\'engagement doit être supérieure à la date de devis',

            // Status
            'state_id.exists' => 'Le statut sélectionné n\'existe pas',

            // Prices
            'total_price_with_taxe.numeric' => 'Le prix total TTC doit être un nombre',
            'total_price_with_taxe.min' => 'Le prix total TTC doit être supérieur ou égal à 0',
            'total_price_without_taxe.numeric' => 'Le prix total HT doit être un nombre',
            'total_price_without_taxe.min' => 'Le prix total HT doit être supérieur ou égal à 0',

            // Customer information (only mandatory fields)
            'customer.required' => 'Les informations du client sont obligatoires',
            'customer.array' => 'Les informations du client doivent être un objet',
            'customer.lastname.required' => 'Le nom de famille du client est obligatoire',
            'customer.lastname.max' => 'Le nom de famille ne doit pas dépasser 255 caractères',
            'customer.firstname.required' => 'Le prénom du client est obligatoire',
            'customer.firstname.max' => 'Le prénom ne doit pas dépasser 255 caractères',
            'customer.phone.required' => 'Le numéro de téléphone est obligatoire',
            'customer.phone.max' => 'Le numéro de téléphone ne doit pas dépasser 20 caractères',

            // Address information (only mandatory fields)
            'customer.address.required' => 'L\'adresse du client est obligatoire',
            'customer.address.array' => 'L\'adresse doit être un objet',
            'customer.address.address1.required' => 'L\'adresse (ligne 1) est obligatoire',
            'customer.address.address1.max' => 'L\'adresse ne doit pas dépasser 255 caractères',
            'customer.address.postcode.required' => 'Le code postal est obligatoire',
            'customer.address.postcode.max' => 'Le code postal ne doit pas dépasser 10 caractères',
            'customer.address.city.required' => 'La ville est obligatoire',
            'customer.address.city.max' => 'La ville ne doit pas dépasser 255 caractères',

            // Products
            'products.array' => 'Les produits doivent être un tableau',
            'products.*.product_id.exists' => 'Le produit sélectionné n\'existe pas',
            'products.*.details.max' => 'Les détails du produit ne doivent pas dépasser 255 caractères',
        ];
    }
}
