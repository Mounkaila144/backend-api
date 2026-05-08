<?php

namespace Modules\UsersGuard\Providers;

use Illuminate\Support\ServiceProvider;

class UsersGuardServiceProvider extends ServiceProvider
{
    protected $moduleName = 'UsersGuard';

    protected $moduleNameLower = 'usersguard';

    /**
     * Boot the application events.
     */
    public function boot(): void
    {
        $this->registerConfig();
        $this->loadRoutesFrom(module_path($this->moduleName, 'Routes/admin.php'));
        $this->loadRoutesFrom(module_path($this->moduleName, 'Routes/superadmin.php'));
        $this->loadRoutesFrom(module_path($this->moduleName, 'Routes/frontend.php'));
    }

    /**
     * Register the service provider.
     *
     * NOTE: We intentionally do NOT register UsersGuard's RouteServiceProvider here.
     * The route files (admin/superadmin/frontend) are already loaded above via
     * loadRoutesFrom(). Registering RouteServiceProvider in addition would re-wrap
     * the same files in `Route::prefix('api')->group(...)`, producing duplicate
     * routes at api/api/admin/* (and so on).
     */
    public function register(): void
    {
        //
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
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [];
    }
}
