<?php

namespace Modules\Superadmin\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;

class SuperadminServiceProvider extends ServiceProvider
{
    /**
     * @var string Module name
     */
    protected $moduleName = 'Superadmin';

    /**
     * @var string Module name lowercase
     */
    protected $moduleNameLower = 'superadmin';

    /**
     * Boot the application events.
     */
    public function boot(): void
    {
        $this->registerTranslations();
        $this->registerConfig();
        $this->registerViews();
        $this->loadMigrationsFrom(module_path($this->moduleName, 'Database/migrations'));
        $this->registerRoutes();
        $this->registerEventListeners();
        $this->registerHealthChecks();
    }

    /**
     * Register event listeners
     */
    protected function registerEventListeners(): void
    {
        Event::listen(
            [\Modules\Superadmin\Events\ModuleActivated::class, \Modules\Superadmin\Events\ModuleDeactivated::class],
            \Modules\Superadmin\Listeners\InvalidateModuleCache::class
        );

        // Audit trail logging
        Event::listen(
            \Modules\Superadmin\Events\ModuleActivated::class,
            [\Modules\Superadmin\Listeners\LogModuleActivation::class, 'handleActivated']
        );

        Event::listen(
            \Modules\Superadmin\Events\ModuleDeactivated::class,
            [\Modules\Superadmin\Listeners\LogModuleActivation::class, 'handleDeactivated']
        );

        Event::listen(
            \Modules\Superadmin\Events\ModuleActivationFailed::class,
            [\Modules\Superadmin\Listeners\LogModuleActivation::class, 'handleFailed']
        );

        // Service config audit trail
        Event::listen(
            \Modules\Superadmin\Events\ServiceConfigUpdated::class,
            \Modules\Superadmin\Listeners\LogServiceConfigUpdate::class
        );
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->app->register(RouteServiceProvider::class);

        // Bind ModuleCacheService as singleton
        $this->app->singleton(
            \Modules\Superadmin\Services\ModuleCacheService::class
        );

        // Bind ModuleDiscovery service
        $this->app->bind(
            \Modules\Superadmin\Services\ModuleDiscoveryInterface::class,
            \Modules\Superadmin\Services\ModuleDiscovery::class
        );

        // Bind ModuleDependencyResolver service
        $this->app->bind(
            \Modules\Superadmin\Services\ModuleDependencyResolverInterface::class,
            \Modules\Superadmin\Services\ModuleDependencyResolver::class
        );

        // Bind TenantStorageManager service
        $this->app->bind(
            \Modules\Superadmin\Services\TenantStorageManagerInterface::class,
            \Modules\Superadmin\Services\TenantStorageManager::class
        );

        // Bind TenantMigrationRunner service
        $this->app->bind(
            \Modules\Superadmin\Services\TenantMigrationRunnerInterface::class,
            \Modules\Superadmin\Services\TenantMigrationRunner::class
        );

        // Bind SagaOrchestrator (transient binding - new instance each time)
        $this->app->bind(
            \Modules\Superadmin\Services\SagaOrchestrator::class
        );

        // Bind ModuleInstaller service
        $this->app->bind(
            \Modules\Superadmin\Services\ModuleInstallerInterface::class,
            \Modules\Superadmin\Services\ModuleInstaller::class
        );

        // Bind ServiceHealthChecker as singleton
        $this->app->singleton(\Modules\Superadmin\Services\ServiceHealthChecker::class, function ($app) {
            return new \Modules\Superadmin\Services\ServiceHealthChecker(
                $app->make(\Modules\Superadmin\Services\Checkers\S3HealthChecker::class),
                $app->make(\Modules\Superadmin\Services\Checkers\DatabaseHealthChecker::class),
                $app->make(\Modules\Superadmin\Services\Checkers\RedisHealthChecker::class),
                $app->make(\Modules\Superadmin\Services\Checkers\ResendHealthChecker::class),
                $app->make(\Modules\Superadmin\Services\Checkers\MeilisearchHealthChecker::class)
            );
        });
    }

    /**
     * Register config.
     */
    protected function registerConfig(): void
    {
        $this->publishes([
            module_path($this->moduleName, 'Config/config.php') => config_path($this->moduleNameLower . '.php'),
        ], 'config');

        $this->mergeConfigFrom(
            module_path($this->moduleName, 'Config/config.php'),
            $this->moduleNameLower
        );
    }

    /**
     * Register views.
     */
    public function registerViews(): void
    {
        $viewPath = resource_path('views/modules/' . $this->moduleNameLower);
        $sourcePath = module_path($this->moduleName, 'Resources/views');

        $this->publishes([
            $sourcePath => $viewPath
        ], ['views', $this->moduleNameLower . '-module-views']);

        $this->loadViewsFrom(array_merge($this->getPublishableViewPaths(), [$sourcePath]), $this->moduleNameLower);
    }

    /**
     * Register translations.
     */
    public function registerTranslations(): void
    {
        $langPath = resource_path('lang/modules/' . $this->moduleNameLower);

        if (is_dir($langPath)) {
            $this->loadTranslationsFrom($langPath, $this->moduleNameLower);
            $this->loadJsonTranslationsFrom($langPath);
        } else {
            $this->loadTranslationsFrom(module_path($this->moduleName, 'Resources/lang'), $this->moduleNameLower);
            $this->loadJsonTranslationsFrom(module_path($this->moduleName, 'Resources/lang'));
        }
    }

    /**
     * Register routes
     */
    protected function registerRoutes(): void
    {
        $modulePath = module_path($this->moduleName);

        // Superadmin routes (Central DB) - PAS de tenant middleware
        if (file_exists($modulePath . '/Routes/superadmin.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/superadmin.php');
        }

        // API routes (si nécessaire)
        if (file_exists($modulePath . '/Routes/api.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/api.php');
        }

        // Web routes (si nécessaire)
        if (file_exists($modulePath . '/Routes/web.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/web.php');
        }
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [];
    }

    /**
     * Register Spatie Health Checks
     */
    protected function registerHealthChecks(): void
    {
        if (!class_exists(\Spatie\Health\Facades\Health::class)) {
            return; // Package not installed
        }

        \Spatie\Health\Facades\Health::checks([
            // Checks standards Spatie
            \Spatie\Health\Checks\Checks\DatabaseCheck::new()
                ->name('database')
                ->connectionName('mysql'),

            \Spatie\Health\Checks\Checks\RedisCheck::new()
                ->name('redis-cache')
                ->connectionName('cache'),

            \Spatie\Health\Checks\Checks\RedisCheck::new()
                ->name('redis-queue')
                ->connectionName('queue'),

            \Spatie\Health\Checks\Checks\EnvironmentCheck::new()
                ->name('environment'),

            \Spatie\Health\Checks\Checks\UsedDiskSpaceCheck::new()
                ->name('disk-space')
                ->warnWhenUsedSpaceIsAbovePercentage(80)
                ->failWhenUsedSpaceIsAbovePercentage(90),

            // Checks custom
            \Modules\Superadmin\Health\Checks\S3Check::new()
                ->name('s3'),

            \Modules\Superadmin\Health\Checks\ResendCheck::new()
                ->name('resend'),

            \Modules\Superadmin\Health\Checks\MeilisearchCheck::new()
                ->name('meilisearch'),
        ]);
    }

    /**
     * Get publishable view paths
     */
    private function getPublishableViewPaths(): array
    {
        $paths = [];
        foreach (Config::get('view.paths') as $path) {
            if (is_dir($path . '/modules/' . $this->moduleNameLower)) {
                $paths[] = $path . '/modules/' . $this->moduleNameLower;
            }
        }
        return $paths;
    }
}
