<?php

namespace Modules\CustomersDocuments\Providers;

use Illuminate\Support\ServiceProvider;

class CustomersDocumentsServiceProvider extends ServiceProvider
{
    protected $moduleName = 'CustomersDocuments';
    protected $moduleNameLower = 'customersdocuments';

    public function boot(): void
    {
        $this->registerConfig();
        $this->registerRoutes();
    }

    public function register(): void {}

    protected function registerRoutes(): void
    {
        $adminRoutes = module_path($this->moduleName, 'Routes/admin.php');
        if (file_exists($adminRoutes)) {
            $this->loadRoutesFrom($adminRoutes);
        }
    }

    protected function registerConfig(): void
    {
        $configPath = module_path($this->moduleName, 'Config/config.php');
        if (file_exists($configPath)) {
            $this->mergeConfigFrom($configPath, $this->moduleNameLower);
        }
    }
}
