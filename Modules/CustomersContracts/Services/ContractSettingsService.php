<?php

namespace Modules\CustomersContracts\Services;

use Illuminate\Support\Facades\Storage;

/**
 * Manages contract settings stored as CustomerContractSettings.dat (PHP serialized)
 * on S3/local storage, exactly like Symfony's mfSettingsBase.
 *
 * Path: {tenant_folder}/frontend/data/settings/CustomerContractSettings.dat
 */
class ContractSettingsService
{
    protected ?array $config = null;

    protected const SETTINGS_FILE = 'CustomerContractSettings';
    protected const SETTINGS_LAYER = 'frontend';

    protected const DEFAULTS = [
        'default_status_id' => null,
        'default_attribution_id' => null,
        'default_company_id' => null,
        'default_currency' => 'EUR',
        'format_id' => '000000',
        'number_of_day_for_opc' => 1,
        'number_of_attributions' => 500,
        'filter_numberofitems_by_page' => 100,

        // Boolean flags (Symfony stores as YES/NO)
        'tax_amount_display' => 'NO',
        'tax_amount_display_list' => 'NO',
        'autocomplete_list' => 'YES',
        'ttc_change_by_tax' => 'YES',
        'comment_sale1' => 'NO',
        'comment_sale2' => 'NO',
        'comment_creation' => 'NO',
        'comment_delete' => 'NO',
        'comment_install_status' => 'NO',
        'comment_opc_status' => 'NO',
        'comment_time_state' => 'NO',
        'has_assistant' => 'NO',
        'has_polluter' => 'NO',
        'has_partner_layer' => 'NO',

        // Status transition IDs (Symfony key names)
        'status_if_confirmed_id' => null,
        'status_if_unconfirmed_id' => null,
        'status_for_cancel_id' => null,
        'status_for_uncancel_id' => null,
        'status_for_blowing_id' => null,
        'status_for_unblowing_id' => null,
        'status_for_placement_id' => null,
        'status_for_unplacement_id' => null,

        // Hold statuses (array of IDs)
        'hold_statuses' => [],

        // Email model IDs
        'change_state_email_model_id' => null,
        'change_state_sales_model_email_id' => null,

        // No-billable contract statuses
        'default_status1_for_no_billable_contract' => null,
        'default_status2_for_no_billable_contract' => null,
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

    // --- Status transition getters (using Symfony key names) ---

    public function getStatusForCancel(): ?int
    {
        return $this->getIntSetting('status_for_cancel_id');
    }

    public function getStatusForUncancel(): ?int
    {
        return $this->getIntSetting('status_for_uncancel_id');
    }

    public function getStatusForBlowing(): ?int
    {
        return $this->getIntSetting('status_for_blowing_id');
    }

    public function getStatusForUnblowing(): ?int
    {
        return $this->getIntSetting('status_for_unblowing_id');
    }

    public function getStatusForPlacement(): ?int
    {
        return $this->getIntSetting('status_for_placement_id');
    }

    public function getStatusForUnplacement(): ?int
    {
        return $this->getIntSetting('status_for_unplacement_id');
    }

    public function getStatusForConfirm(): ?int
    {
        return $this->getIntSetting('status_if_confirmed_id');
    }

    public function getStatusForUnconfirm(): ?int
    {
        return $this->getIntSetting('status_if_unconfirmed_id');
    }

    // --- Convenience getters ---

    public function get(string $key, mixed $default = null): mixed
    {
        $config = $this->loadConfig();

        return $config[$key] ?? $default;
    }

    public function getDefaultStatusId(): ?int
    {
        return $this->getIntSetting('default_status_id');
    }

    public function getDefaultAttributionId(): ?int
    {
        return $this->getIntSetting('default_attribution_id');
    }

    public function getDefaultCompanyId(): ?int
    {
        return $this->getIntSetting('default_company_id');
    }

    public function hasTaxAmountDisplay(): bool
    {
        return $this->getBoolSetting('tax_amount_display');
    }

    public function hasTaxAmountDisplayList(): bool
    {
        return $this->getBoolSetting('tax_amount_display_list');
    }

    public function hasAutocompleteList(): bool
    {
        return $this->getBoolSetting('autocomplete_list');
    }

    public function hasTtcChangeByTax(): bool
    {
        return $this->getBoolSetting('ttc_change_by_tax');
    }

    public function hasPartnerLayer(): bool
    {
        return $this->getBoolSetting('has_partner_layer');
    }

    public function getHoldStatuses(): array
    {
        $config = $this->loadConfig();

        return (array) ($config['hold_statuses'] ?? []);
    }

    public function getNumberOfDayForOpc(): int
    {
        return (int) ($this->loadConfig()['number_of_day_for_opc'] ?? 1);
    }

    public function getNumberOfAttributions(): int
    {
        return (int) ($this->loadConfig()['number_of_attributions'] ?? 500);
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

        // Symfony stores YES/NO
        if (is_string($value)) {
            return in_array(strtoupper($value), ['YES', '1', 'TRUE'], true);
        }

        return (bool) $value;
    }
}
