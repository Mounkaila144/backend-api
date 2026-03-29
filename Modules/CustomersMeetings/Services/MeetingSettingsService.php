<?php

namespace Modules\CustomersMeetings\Services;

use Illuminate\Support\Facades\Storage;

/**
 * Manages meeting settings stored as CustomerMeetingSettings.dat (PHP serialized)
 * on S3/local storage, exactly like Symfony's mfSettingsBase.
 *
 * Path: {tenant_folder}/frontend/data/settings/CustomerMeetingSettings.dat
 *
 * Also falls back to t_service_config for state transition IDs (legacy).
 */
class MeetingSettingsService
{
    protected ?array $config = null;

    protected const SETTINGS_FILE = 'CustomerMeetingSettings';
    protected const SETTINGS_LAYER = 'frontend';

    /**
     * All defaults matching Symfony CustomerMeetingSettings::getDefaults()
     */
    protected const DEFAULTS = [
        // Status transitions
        'status_transfer_to_contract_id' => null,
        'status_by_default_id' => null,
        'status_call_by_default_id' => null,

        // Status transitions for actions (from t_service_config legacy)
        'cancel_status_id' => null,
        'uncancel_status_id' => null,
        'confirm_status_id' => null,
        'unconfirm_status_id' => null,

        // Schedule
        'schedule_start_time' => '6:00',
        'schedule_end_time' => '23:00',
        'schedule_scale_time' => 0,
        'input_scale_time' => 15,

        // Feature toggles (YES/NO like Symfony)
        'autocomplete_list' => 'YES',
        'has_assistant' => 'NO',
        'has_lock_management' => 'NO',
        'has_callback' => 'NO',
        'has_callcenter' => 'NO',
        'has_campaign' => 'NO',
        'has_type' => 'NO',
        'has_confirmator' => 'NO',
        'has_callstatus' => 'NO',
        'has_qualification' => 'NO',
        'has_lead_status' => 'NO',
        'has_confirmed_at' => 'NO',
        'has_treated_date' => 'NO',
        'has_registration' => 'NO',
        'has_polluter' => 'NO',
        'has_partner_layer' => 'NO',
        'comment_on_create' => 'NO',

        // Duplicate phone checks
        'duplicate_phone_forbidden' => 'NO',
        'duplicate_phone_forbidden_confirmed' => 'NO',

        // Numeric settings
        'max_multiple_sms' => 10,
        'max_multiple_email' => 10,
        'lock_time_out' => 600, // seconds (10 min)
        'callback_delay' => 10, // minutes
        'filter_numberofitems_by_page' => 100,

        // Mobile required
        'mobile1_required' => false,

        // Assistant state settings
        'assistant_state1_setting_id' => null,
        'assistant_state2_setting_id' => null,
        'assistant_state3_setting_id' => null,

        // Telepro group
        'telepro_group_id' => null,

        // Registration
        'registration_number_format' => '00000000',
        'registration_number_start' => 260,
        'registration_format' => '{year}-{registration}',

        // Updated at states (array of status IDs)
        'updated_at_states' => [],

        // Schedule filter
        'filter_schedule_default_status_call_id' => null,

        // Email/SMS model IDs
        'sales_model_email_id' => null,
        'sales_model_sms_id' => null,
        'change_state_sales_model_email_id' => null,

        // Default company
        'default_company_id' => null,
    ];

    /**
     * Resolve the .dat file path for the current tenant.
     */
    protected function getSettingsPath(): string
    {
        $tenant = \App\Models\Tenant::first();
        $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);

        return $storageManager->getTenantPath($tenant->site_id)
            . '/' . self::SETTINGS_LAYER . '/data/settings/' . self::SETTINGS_FILE . '.dat';
    }

    /**
     * Get the storage disk (S3 or local).
     */
    protected function getDisk(): string
    {
        $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);

        return $storageManager->getCurrentDisk();
    }

    protected function loadConfig(): array
    {
        if ($this->config !== null) {
            return $this->config;
        }

        try {
            $disk = $this->getDisk();
            $path = $this->getSettingsPath();

            if (Storage::disk($disk)->exists($path)) {
                $content = Storage::disk($disk)->get($path);
                $saved = @unserialize($content);

                if (is_array($saved)) {
                    $this->config = array_merge(self::DEFAULTS, $saved);

                    return $this->config;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to defaults
        }

        $this->config = self::DEFAULTS;

        return $this->config;
    }

    /**
     * Force reload config on next access.
     */
    public function refresh(): void
    {
        $this->config = null;
    }

    /**
     * Get all settings merged with defaults.
     */
    public function all(): array
    {
        return $this->loadConfig();
    }

    /**
     * Save settings to .dat file (PHP serialized, same as Symfony).
     */
    public function save(array $settings): void
    {
        $current = $this->loadConfig();

        // Convert boolean inputs to YES/NO for Symfony compatibility
        foreach ($settings as $key => $value) {
            if (is_bool($value)) {
                $settings[$key] = $value ? 'YES' : 'NO';
            }
        }

        $merged = array_merge($current, $settings);

        $disk = $this->getDisk();
        $path = $this->getSettingsPath();

        Storage::disk($disk)->put($path, serialize($merged));

        $this->config = $merged;
    }

    /**
     * Get a single setting value.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $config = $this->loadConfig();

        return $config[$key] ?? $default;
    }

    // --- Status transition getters ---

    public function getStatusTransferToContract(): ?int
    {
        return $this->getIntSetting('status_transfer_to_contract_id');
    }

    public function getStatusByDefault(): ?int
    {
        return $this->getIntSetting('status_by_default_id');
    }

    public function getStatusCallByDefault(): ?int
    {
        return $this->getIntSetting('status_call_by_default_id');
    }

    public function getStatusForCancel(): ?int
    {
        return $this->getIntSetting('cancel_status_id');
    }

    public function getStatusForUncancel(): ?int
    {
        return $this->getIntSetting('uncancel_status_id');
    }

    public function getStatusForConfirm(): ?int
    {
        return $this->getIntSetting('confirm_status_id');
    }

    public function getStatusForUnconfirm(): ?int
    {
        return $this->getIntSetting('unconfirm_status_id');
    }

    // --- Feature flag getters ---

    public function hasAssistant(): bool
    {
        return $this->getBoolSetting('has_assistant');
    }

    public function hasLock(): bool
    {
        return $this->getBoolSetting('has_lock_management');
    }

    public function hasCallback(): bool
    {
        return $this->getBoolSetting('has_callback');
    }

    public function hasCallcenter(): bool
    {
        return $this->getBoolSetting('has_callcenter');
    }

    public function hasCampaign(): bool
    {
        return $this->getBoolSetting('has_campaign');
    }

    public function hasType(): bool
    {
        return $this->getBoolSetting('has_type');
    }

    public function hasCallStatus(): bool
    {
        return $this->getBoolSetting('has_callstatus');
    }

    public function hasQualification(): bool
    {
        return $this->getBoolSetting('has_qualification');
    }

    public function hasLeadStatus(): bool
    {
        return $this->getBoolSetting('has_lead_status');
    }

    public function hasConfirmedAt(): bool
    {
        return $this->getBoolSetting('has_confirmed_at');
    }

    public function hasTreatedDate(): bool
    {
        return $this->getBoolSetting('has_treated_date');
    }

    public function hasRegistration(): bool
    {
        return $this->getBoolSetting('has_registration');
    }

    public function hasPolluter(): bool
    {
        return $this->getBoolSetting('has_polluter');
    }

    public function hasPartnerLayer(): bool
    {
        return $this->getBoolSetting('has_partner_layer');
    }

    public function isDuplicatePhoneForbidden(): bool
    {
        return $this->getBoolSetting('duplicate_phone_forbidden');
    }

    public function isDuplicatePhoneForbiddenConfirmed(): bool
    {
        return $this->getBoolSetting('duplicate_phone_forbidden_confirmed');
    }

    public function getUpdatedAtStates(): array
    {
        $config = $this->loadConfig();

        return (array) ($config['updated_at_states'] ?? []);
    }

    // --- Helpers ---

    protected function getIntSetting(string $key): ?int
    {
        $config = $this->loadConfig();

        return isset($config[$key]) && $config[$key] !== null && $config[$key] !== ''
            ? (int) $config[$key]
            : null;
    }

    protected function getBoolSetting(string $key): bool
    {
        $config = $this->loadConfig();
        $value = $config[$key] ?? false;

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return in_array(strtoupper($value), ['YES', '1', 'TRUE'], true);
        }

        return (bool) $value;
    }
}
