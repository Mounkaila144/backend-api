<?php

namespace Modules\CustomersContracts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContractSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isSuperadmin() || $user->hasCredential([['admin', 'contract_settings']]));
    }

    public function rules(): array
    {
        return [
            'default_status_id' => 'nullable',
            'default_attribution_id' => 'nullable',
            'default_company_id' => 'nullable',
            'default_currency' => 'nullable|string|max:10',
            'format_id' => 'nullable|string|max:50',
            'number_of_day_for_opc' => 'nullable|integer|min:0|max:10',
            'number_of_attributions' => 'nullable|integer|min:10|max:5000',
            'filter_numberofitems_by_page' => 'nullable|integer',

            // Boolean flags (YES/NO or true/false)
            'tax_amount_display' => 'nullable',
            'tax_amount_display_list' => 'nullable',
            'autocomplete_list' => 'nullable',
            'ttc_change_by_tax' => 'nullable',
            'comment_sale1' => 'nullable',
            'comment_sale2' => 'nullable',
            'comment_creation' => 'nullable',
            'comment_delete' => 'nullable',
            'comment_install_status' => 'nullable',
            'comment_opc_status' => 'nullable',
            'comment_time_state' => 'nullable',
            'has_assistant' => 'nullable',
            'has_polluter' => 'nullable',
            'has_partner_layer' => 'nullable',

            // Status transition IDs (Symfony key names)
            'status_if_confirmed_id' => 'nullable',
            'status_if_unconfirmed_id' => 'nullable',
            'status_for_cancel_id' => 'nullable',
            'status_for_uncancel_id' => 'nullable',
            'status_for_blowing_id' => 'nullable',
            'status_for_unblowing_id' => 'nullable',
            'status_for_placement_id' => 'nullable',
            'status_for_unplacement_id' => 'nullable',

            // Hold statuses (array of IDs)
            'hold_statuses' => 'nullable|array',
            'hold_statuses.*' => 'integer',

            // Email model IDs
            'change_state_email_model_id' => 'nullable',
            'change_state_sales_model_email_id' => 'nullable',

            // No-billable contract statuses
            'default_status1_for_no_billable_contract' => 'nullable',
            'default_status2_for_no_billable_contract' => 'nullable',
        ];
    }
}
