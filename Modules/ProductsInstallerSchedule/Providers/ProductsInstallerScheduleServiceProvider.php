<?php

namespace Modules\ProductsInstallerSchedule\Providers;

use Illuminate\Support\ServiceProvider;

class ProductsInstallerScheduleServiceProvider extends ServiceProvider
{
    protected $moduleName = 'ProductsInstallerSchedule';
    protected $moduleNameLower = 'productsinstallerschedule';

    public function boot(): void
    {
        $this->registerConfig();
    }

    public function register(): void {}

    protected function registerConfig(): void
    {
        $configPath = module_path($this->moduleName, 'Config/config.php');
        if (file_exists($configPath)) {
            $this->mergeConfigFrom($configPath, $this->moduleNameLower);
        }
    }
}
