<?php

namespace Modules\CustomersCommunicationSms\Providers;

use Illuminate\Support\ServiceProvider;

class CustomersCommunicationSmsServiceProvider extends ServiceProvider
{
    protected $moduleName = 'CustomersCommunicationSms';
    protected $moduleNameLower = 'customerscommunicationsms';

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
