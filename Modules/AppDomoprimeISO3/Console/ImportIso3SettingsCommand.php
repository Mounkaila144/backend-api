<?php

namespace Modules\AppDomoprimeISO3\Console;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Modules\AppDomoprimeISO3\Entities\QuotationTypeSettings;
use Throwable;

class ImportIso3SettingsCommand extends Command
{
    protected $signature = 'iso3:import-settings
                            {--tenant= : Tenant site_id (omit to import for all available tenants)}
                            {--symfony-root= : Path to the Symfony project root (defaults to env ISO3_SYMFONY_ROOT or C:/xampp/htdocs/project)}
                            {--app=frontend : Symfony application folder containing the .dat files (admin or frontend)}';

    protected $description = 'Import ITE/BOILER/PACK/TYPE1/TYPE2 product lists from the Symfony DomoprimeIso3Settings.dat into t_quotation_type_settings.';

    private const POLLUTER_TYPES = ['ITE', 'BOILER', 'PACK', 'TYPE1', 'TYPE2'];

    public function handle(): int
    {
        $symfonyRoot = $this->resolveSymfonyRoot();
        $app = (string) $this->option('app');

        $tenantId = $this->option('tenant');
        $tenants = $tenantId
            ? Tenant::query()->where('site_id', $tenantId)->get()
            : Tenant::query()->available()->get();

        if ($tenants->isEmpty()) {
            $this->error($tenantId ? "Tenant {$tenantId} not found." : 'No available tenant found.');
            return self::FAILURE;
        }

        $exitCode = self::SUCCESS;

        foreach ($tenants as $tenant) {
            $siteDb = (string) $tenant->site_db_name;
            if ($siteDb === '') {
                $this->warn("Tenant {$tenant->site_id}: missing site_db_name, skipping.");
                continue;
            }

            $datPath = sprintf(
                '%s/sites/%s/%s/data/settings/DomoprimeIso3Settings.dat',
                rtrim($symfonyRoot, '/\\'),
                $siteDb,
                $app
            );

            if (! is_readable($datPath)) {
                $this->warn("Tenant {$siteDb}: settings file not found at {$datPath}");
                continue;
            }

            $raw = @file_get_contents($datPath);
            if ($raw === false) {
                $this->warn("Tenant {$siteDb}: could not read {$datPath}");
                continue;
            }

            $settings = @unserialize($raw, ['allowed_classes' => false]);
            if (! is_array($settings)) {
                $this->warn("Tenant {$siteDb}: settings file is not a valid serialized array.");
                continue;
            }

            try {
                tenancy()->initialize($tenant);
                $imported = $this->upsertForTenant($settings);
                $this->info("Tenant {$siteDb}: imported {$imported} polluter type(s).");
            } catch (Throwable $e) {
                $this->error("Tenant {$siteDb}: {$e->getMessage()}");
                $exitCode = self::FAILURE;
            } finally {
                tenancy()->end();
            }
        }

        return $exitCode;
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    private function upsertForTenant(array $settings): int
    {
        $count = 0;

        foreach (self::POLLUTER_TYPES as $type) {
            $key = strtolower($type) . '_products';
            $value = $settings[$key] ?? null;

            if (! is_array($value) || empty($value)) {
                continue;
            }

            $productIds = array_values(array_unique(array_map('intval', $value)));

            QuotationTypeSettings::updateOrCreate(
                ['polluter_type' => $type],
                ['product_ids' => $productIds]
            );

            $count++;
        }

        return $count;
    }

    private function resolveSymfonyRoot(): string
    {
        $option = $this->option('symfony-root');
        if ($option) {
            return (string) $option;
        }

        $env = env('ISO3_SYMFONY_ROOT');
        if ($env) {
            return (string) $env;
        }

        return 'C:/xampp/htdocs/project';
    }
}
