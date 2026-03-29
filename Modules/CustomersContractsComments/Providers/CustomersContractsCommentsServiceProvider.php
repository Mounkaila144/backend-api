<?php

namespace Modules\CustomersContractsComments\Providers;

use Illuminate\Support\ServiceProvider;

class CustomersContractsCommentsServiceProvider extends ServiceProvider
{
    protected $moduleName = 'CustomersContractsComments';
    protected $moduleNameLower = 'customerscontractscomments';

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
