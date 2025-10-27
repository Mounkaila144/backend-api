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
            'reference' => 'sometimes|required|string|max:255|unique:t_customers_contract,reference,'.$contractId,
            'customer_id' => 'sometimes|required|integer|exists:t_customers,id',
            'meeting_id' => 'nullable|integer|exists:t_customers_meeting,id',
            'financial_partner_id' => 'sometimes|required|integer',
            'tax_id' => 'sometimes|required|integer',
            'team_id' => 'sometimes|required|integer',
            'telepro_id' => 'sometimes|required|integer',
            'sale_1_id' => 'sometimes|required|integer',
            'sale_2_id' => 'nullable|integer',
            'manager_id' => 'sometimes|required|integer',
            'assistant_id' => 'nullable|integer',
            'installer_user_id' => 'nullable|integer|exists:t_users,id',
            'opened_at' => 'nullable|date',
            'opened_at_range_id' => 'nullable|integer',
            'sent_at' => 'nullable|date',
            'payment_at' => 'nullable|date',
            'opc_at' => 'nullable|date',
            'opc_range_id' => 'nullable|integer',
            'apf_at' => 'nullable|date',
            'state_id' => 'sometimes|required|integer|exists:t_customers_contracts_status,id',
            'install_state_id' => 'nullable|integer|exists:t_customers_contracts_install_status,id',
            'admin_status_id' => 'nullable|integer|exists:t_customers_contracts_admin_status,id',
            'total_price_with_taxe' => 'sometimes|required|numeric|min:0',
            'total_price_without_taxe' => 'sometimes|required|numeric|min:0',
            'remarks' => 'nullable|string',
            'variables' => 'nullable|json',
            'is_signed' => 'nullable|in:YES,NO',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'company_id' => 'nullable|integer',

            // Products (if updating)
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
            'reference.unique' => 'This contract reference already exists',
            'customer_id.exists' => 'Selected customer does not exist',
            'state_id.exists' => 'Selected status does not exist',
            'total_price_with_taxe.min' => 'Total price with tax must be positive',
            'total_price_without_taxe.min' => 'Total price without tax must be positive',
        ];
    }
}
