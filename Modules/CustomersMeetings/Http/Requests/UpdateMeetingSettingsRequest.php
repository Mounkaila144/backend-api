<?php

namespace Modules\CustomersMeetings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMeetingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isSuperadmin() || $user->hasCredential([['admin', 'meeting_settings']]));
    }

    public function rules(): array
    {
        return [
            // Status transitions
            'status_transfer_to_contract_id' => 'nullable',
            'status_by_default_id' => 'nullable',
            'status_call_by_default_id' => 'nullable',
            'cancel_status_id' => 'nullable',
            'uncancel_status_id' => 'nullable',
            'confirm_status_id' => 'nullable',
            'unconfirm_status_id' => 'nullable',

            // Schedule
            'schedule_start_time' => 'nullable|string|max:10',
            'schedule_end_time' => 'nullable|string|max:10',
            'schedule_scale_time' => 'nullable|integer|min:0',
            'input_scale_time' => 'nullable|integer|min:5|max:60',

            // Feature toggles (YES/NO)
            'autocomplete_list' => 'nullable',
            'has_assistant' => 'nullable',
            'has_lock_management' => 'nullable',
            'has_callback' => 'nullable',
            'has_callcenter' => 'nullable',
            'has_campaign' => 'nullable',
            'has_type' => 'nullable',
            'has_confirmator' => 'nullable',
            'has_callstatus' => 'nullable',
            'has_qualification' => 'nullable',
            'has_lead_status' => 'nullable',
            'has_confirmed_at' => 'nullable',
            'has_treated_date' => 'nullable',
            'has_registration' => 'nullable',
            'has_polluter' => 'nullable',
            'has_partner_layer' => 'nullable',
            'comment_on_create' => 'nullable',

            // Duplicate phone checks
            'duplicate_phone_forbidden' => 'nullable',
            'duplicate_phone_forbidden_confirmed' => 'nullable',

            // Numeric settings
            'max_multiple_sms' => 'nullable|integer|min:1',
            'max_multiple_email' => 'nullable|integer|min:1',
            'lock_time_out' => 'nullable|integer|min:60|max:3600',
            'callback_delay' => 'nullable|integer|min:10|max:180',
            'filter_numberofitems_by_page' => 'nullable|integer|min:5|max:500',

            // Mobile required
            'mobile1_required' => 'nullable',

            // Assistant states
            'assistant_state1_setting_id' => 'nullable',
            'assistant_state2_setting_id' => 'nullable',
            'assistant_state3_setting_id' => 'nullable',

            // Telepro group
            'telepro_group_id' => 'nullable',

            // Registration
            'registration_number_format' => 'nullable|string|max:50',
            'registration_number_start' => 'nullable|integer|min:0',

            // Updated at states (array of status IDs)
            'updated_at_states' => 'nullable|array',
            'updated_at_states.*' => 'integer',

            // Schedule filter
            'filter_schedule_default_status_call_id' => 'nullable',

            // Email/SMS model IDs
            'sales_model_email_id' => 'nullable',
            'sales_model_sms_id' => 'nullable',
            'change_state_sales_model_email_id' => 'nullable',

            // Default company
            'default_company_id' => 'nullable',
        ];
    }
}
