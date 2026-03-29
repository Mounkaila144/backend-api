<?php

namespace Modules\CustomersContractsDocumentsCheck\Providers;

use Illuminate\Support\ServiceProvider;

class CustomersContractsDocumentsCheckServiceProvider extends ServiceProvider
{
    protected $moduleName = 'CustomersContractsDocumentsCheck';
    protected $moduleNameLower = 'customerscontractsdocumentscheck';

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
