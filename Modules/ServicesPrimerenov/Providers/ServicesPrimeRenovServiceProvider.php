<?php

namespace Modules\ServicesPrimerenov\Providers;

use Illuminate\Support\ServiceProvider;

class ServicesPrimeRenovServiceProvider extends ServiceProvider
{
    protected $moduleName = 'ServicesPrimerenov';
    protected $moduleNameLower = 'servicesprimerenov';

    public function boot(): void
    {
        $this->mergeConfigFrom(
            module_path($this->moduleName, 'Config/config.php'),
            $this->moduleNameLower
        );

        $this->registerRoutes();
    }

    public function register(): void
    {
        //
    }

    protected function registerRoutes(): void
    {
        $modulePath = module_path($this->moduleName);

        if (file_exists($modulePath . '/Routes/admin.php')) {
            $this->loadRoutesFrom($modulePath . '/Routes/admin.php');
        }
    }
}
