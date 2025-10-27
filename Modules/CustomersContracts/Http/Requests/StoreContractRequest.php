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
            'reference' => 'required|string|max:255|unique:t_customers_contract,reference',
            'customer_id' => 'required|integer|exists:t_customers,id',
            'meeting_id' => 'nullable|integer|exists:t_customers_meeting,id',
            'financial_partner_id' => 'required|integer',
            'tax_id' => 'required|integer',
            'team_id' => 'required|integer',
            'telepro_id' => 'required|integer',
            'sale_1_id' => 'required|integer',
            'sale_2_id' => 'nullable|integer',
            'manager_id' => 'required|integer',
            'assistant_id' => 'nullable|integer',
            'installer_user_id' => 'nullable|integer|exists:t_users,id',
            'opened_at' => 'nullable|date',
            'opened_at_range_id' => 'nullable|integer',
            'sent_at' => 'nullable|date',
            'payment_at' => 'nullable|date',
            'opc_at' => 'nullable|date',
            'opc_range_id' => 'nullable|integer',
            'apf_at' => 'nullable|date',
            'state_id' => 'required|integer|exists:t_customers_contracts_status,id',
            'install_state_id' => 'nullable|integer|exists:t_customers_contracts_install_status,id',
            'admin_status_id' => 'nullable|integer|exists:t_customers_contracts_admin_status,id',
            'total_price_with_taxe' => 'required|numeric|min:0',
            'total_price_without_taxe' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
            'variables' => 'nullable|json',
            'is_signed' => 'nullable|in:YES,NO',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'company_id' => 'nullable|integer',

            // Products
            'products' => 'nullable|array',
            'products.*.product_id' => 'required|integer|exists:t_products,id',
            'products.*.details' => 'nullable|string|max:255',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'reference.required' => 'Contract reference is required',
            'reference.unique' => 'This contract reference already exists',
            'customer_id.required' => 'Customer is required',
            'customer_id.exists' => 'Selected customer does not exist',
            'state_id.required' => 'Contract status is required',
            'state_id.exists' => 'Selected status does not exist',
            'total_price_with_taxe.required' => 'Total price with tax is required',
            'total_price_without_taxe.required' => 'Total price without tax is required',
        ];
    }
}
