<?php

namespace Modules\Dashboard\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;

class DashboardServiceProvider extends ServiceProvider
{
    /**
     * @var string Module name
     */
    protected $moduleName = 'Dashboard';

    /**
     * @var string Module name lowercase
     */
    protected $moduleNameLower = 'dashboard';

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
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->app->register(RouteServiceProvider::class);
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

        // Admin routes (Tenant DB)
        if (file_exists($modulePath . '/Routes/admin.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/admin.php');
        }

        // Superadmin routes (Central DB)
        if (file_exists($modulePath . '/Routes/superadmin.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/superadmin.php');
        }

        // Frontend routes (Tenant DB)
        if (file_exists($modulePath . '/Routes/frontend.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/frontend.php');
        }

        // API routes
        if (file_exists($modulePath . '/Routes/api.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/api.php');
        }

        // Web routes
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