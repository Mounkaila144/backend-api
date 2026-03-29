<?php

namespace Modules\CustomersContractsBilling\Providers;

use Illuminate\Support\ServiceProvider;

class CustomersContractsBillingServiceProvider extends ServiceProvider
{
    protected $moduleName = 'CustomersContractsBilling';
    protected $moduleNameLower = 'customerscontractsbilling';

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
