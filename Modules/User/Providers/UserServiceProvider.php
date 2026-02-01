<?php

namespace Modules\User\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;
use Modules\User\Console\FlushUserCacheCommand;
use Modules\User\Console\ReindexUsersCommand;
use Modules\User\Services\UserCacheService;
use Modules\User\Services\UserSearchService;
use Modules\User\Services\UserStorageService;

class UserServiceProvider extends ServiceProvider
{
    /**
     * @var string Module name
     */
    protected $moduleName = 'User';

    /**
     * @var string Module name lowercase
     */
    protected $moduleNameLower = 'user';

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
        $this->registerCommands();
    }

    /**
     * Register Artisan commands
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                ReindexUsersCommand::class,
                FlushUserCacheCommand::class,
            ]);
        }
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->app->register(RouteServiceProvider::class);

        // Register Cloud Services as singletons
        $this->registerCloudServices();
    }

    /**
     * Register cloud services (S3, Redis, Meilisearch)
     */
    protected function registerCloudServices(): void
    {
        // UserStorageService - Gestion du stockage S3/MinIO
        $this->app->singleton(UserStorageService::class, function ($app) {
            return new UserStorageService(
                $app->make(\Modules\Superadmin\Services\ServiceConfigManager::class)
            );
        });

        // UserCacheService - Gestion du cache Redis
        $this->app->singleton(UserCacheService::class, function ($app) {
            return new UserCacheService(
                $app->make(\Modules\Superadmin\Services\ServiceConfigManager::class)
            );
        });

        // UserSearchService - Recherche Meilisearch
        $this->app->singleton(UserSearchService::class, function ($app) {
            return new UserSearchService(
                $app->make(\Modules\Superadmin\Services\ServiceConfigManager::class)
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
        return [
            UserStorageService::class,
            UserCacheService::class,
            UserSearchService::class,
        ];
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