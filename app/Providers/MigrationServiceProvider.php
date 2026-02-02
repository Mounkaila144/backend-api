<?php

namespace App\Providers;

use App\Services\Migration\FileMigrationService;
use App\Services\Migration\LegacyFileResolver;
use App\Services\Migration\LegacyPathMapper;
use Illuminate\Support\ServiceProvider;

class MigrationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge configuration
        $this->mergeConfigFrom(
            base_path('config/migration.php'),
            'migration'
        );

        // Register LegacyPathMapper as singleton
        $this->app->singleton(LegacyPathMapper::class, function ($app) {
            $mapper = new LegacyPathMapper(
                config('migration.legacy_path')
            );

            // Load custom site mappings
            foreach (config('migration.site_mapping', []) as $siteName => $tenantId) {
                $mapper->setSiteMapping($siteName, $tenantId);
            }

            return $mapper;
        });

        // Register FileMigrationService as singleton
        $this->app->singleton(FileMigrationService::class, function ($app) {
            return new FileMigrationService(
                $app->make(LegacyPathMapper::class),
                $app->make(\Modules\Superadmin\Services\ServiceConfigManager::class)
            );
        });

        // Register LegacyFileResolver as singleton
        $this->app->singleton(LegacyFileResolver::class, function ($app) {
            return new LegacyFileResolver(
                $app->make(LegacyPathMapper::class),
                $app->make(\Modules\Superadmin\Services\ServiceConfigManager::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish configuration
        $this->publishes([
            base_path('config/migration.php') => config_path('migration.php'),
        ], 'migration-config');

        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                \App\Console\Commands\MigrateFilesCommand::class,
                \App\Console\Commands\AnalyzeLegacyFilesCommand::class,
            ]);
        }
    }
}
