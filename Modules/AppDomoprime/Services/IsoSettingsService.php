<?php

namespace Modules\AppDomoprime\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * Manages ISO settings stored as DomoprimeSettings.dat (PHP serialized).
 * Mirrors Symfony's DomoprimeSettings / mfSettingsBase exactly.
 *
 * Path: {tenant_folder}/frontend/data/settings/DomoprimeSettings.dat
 */
class IsoSettingsService
{
    protected ?array $config = null;

    protected const SETTINGS_FILE  = 'DomoprimeSettings';
    protected const SETTINGS_LAYER = 'frontend';

    protected const DEFAULTS = [
        // Form field mappings
        'surface_wall_formfield'              => '',
        'surface_floor_formfield'             => '',
        'surface_top_formfield'               => '',
        'energy_formfield'                    => '',
        'number_of_people_formfield'          => '',
        'revenue_formfield'                   => '',
        'owner_formfield'                     => '',

        // Form field value mappings
        'energy_combustible_formfield_value'       => null,
        'energy_electricity_formfield_value'       => null,
        'owner_occupant_owner_formfield_value'     => null,
        'owner_tenant_formfield_value'             => null,
        'owner_no_occupant_owner_formfield_value'  => null,
        'owner_free_formfield_value'               => null,
        'owner_wall_formfield_value'               => null,
        'owner_floor_formfield_value'              => null,

        // Energy/surface products
        'energy_combustible'   => null,
        'energy_electricity'   => null,
        'surface_wall_product' => null,
        'surface_floor_product'=> null,
        'surface_top_product'  => null,

        // Class & limits
        'classic_class'  => null,
        'sales_limit'    => 0,
        'energy_filter'  => [],
        'class_filter'   => [],

        // Default model IDs
        'quotation_model_id'      => null,
        'billing_model_id'        => null,
        'asset_model_id'          => null,
        'premeeting_model_id'     => null,
        'billing_email_model_id'  => null,
        'after_work_model_id'     => null,

        // Financial
        'rest_in_charge'        => 1.0,
        'fee_file'              => 0.0,
        'tax_fee_file'          => 0.2,
        'pourcentage_advance'   => 0.3,
        'ana_tax'               => 0,
        'ana_pack_tax'          => 0,

        // Status IDs
        'install_in_progess_status_id' => null,

        // Reference formats
        'quotation_reference_format' => '',
        'billing_reference_format'   => '',
        'asset_reference_format'     => '',

        // Behaviour flags (YES/NO)
        'ah_archivage'              => 'NO',
        'quotation_archivage'       => 'NO',
        'billing_archivage'         => 'NO',
        'multi_documents_archivage' => 'NO',
        'premeeting_archivage'      => 'NO',
        'verif_archivage'           => 'NO',
        'signed_verif_archivage'    => 'NO',
        'tax_credit'                => 'NO',
        'calculation_on_contrat_save' => 'YES',
        'calculation_on_meeting_save' => 'YES',
        'quotation_multi_pdf'         => 'NO',

        // Numeric settings
        'quotation_shift_for_dated_at' => 0,
        'multiple_billings_max'        => 30,

        // Engine settings
        'quotation_engine'       => '',
        'cumac_engine'           => null,
        'quotation_multi_engine' => null,

        // Boolean flags (stored as PHP bool by Symfony)
        'coef_multiples' => false,
    ];

    protected static array $configByTenant = [];

    // ─── Storage helpers ──────────────────────────────────────────────────────

    protected function getSettingsPath(): string
    {
        $tenant = tenant() ?? \App\Models\Tenant::first();
        $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);

        return $storageManager->getTenantPath($tenant->site_id)
            . '/' . self::SETTINGS_LAYER . '/data/settings/' . self::SETTINGS_FILE . '.dat';
    }

    protected function getDisk(): string
    {
        $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);

        return $storageManager->getCurrentDisk();
    }

    // ─── Cache management ─────────────────────────────────────────────────────

    protected function getCacheKey(): string
    {
        $tenant = tenant() ?? \App\Models\Tenant::first();
        return 'iso_settings:' . ($tenant->site_id ?? 'default');
    }

    protected function clearCache(): void
    {
        $tenant = tenant() ?? \App\Models\Tenant::first();
        $tenantKey = $tenant->site_id ?? 'default';
        unset(self::$configByTenant[$tenantKey]);

        try {
            Cache::store('file')->forget($this->getCacheKey());
        } catch (\Throwable) {
        }
    }

    // ─── Core load / save ─────────────────────────────────────────────────────

    protected function loadConfig(): array
    {
        if ($this->config !== null) {
            return $this->config;
        }

        $tenant = tenant() ?? \App\Models\Tenant::first();
        $tenantKey = $tenant->site_id ?? 'default';

        if (isset(self::$configByTenant[$tenantKey])) {
            $this->config = self::$configByTenant[$tenantKey];
            return $this->config;
        }

        $ttl = 600;
        try {
            $cached = Cache::store('file')->get($this->getCacheKey());
            if (is_array($cached)) {
                self::$configByTenant[$tenantKey] = $cached;
                $this->config = $cached;
                return $this->config;
            }
        } catch (\Throwable) {
        }

        $config = self::DEFAULTS;
        try {
            $disk = $this->getDisk();
            $path = $this->getSettingsPath();

            if (Storage::disk($disk)->exists($path)) {
                $content = Storage::disk($disk)->get($path);
                $saved   = @unserialize($content, ['allowed_classes' => false]);

                if (is_array($saved)) {
                    $config = array_merge(self::DEFAULTS, $saved);
                }
            }
        } catch (\Throwable) {
        }

        try {
            Cache::store('file')->put($this->getCacheKey(), $config, $ttl);
        } catch (\Throwable) {
        }

        self::$configByTenant[$tenantKey] = $config;
        $this->config = $config;
        return $this->config;
    }

    public function save(array $settings): void
    {
        $current = $this->loadConfig();

        foreach ($settings as $key => $value) {
            if (is_bool($value)) {
                $settings[$key] = $value;
            }
        }

        $merged = array_merge($current, $settings);

        $disk = $this->getDisk();
        $path = $this->getSettingsPath();

        Storage::disk($disk)->put($path, serialize($merged));

        $this->config = $merged;
        $this->clearCache();
    }

    public function refresh(): void
    {
        $this->config = null;
        $this->clearCache();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public function all(): array
    {
        return $this->loadConfig();
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->loadConfig()[$key] ?? $default;
    }
}
