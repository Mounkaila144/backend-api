<?php

namespace Modules\CustomersCommunicationEmails\Providers;

use Illuminate\Support\ServiceProvider;

class CustomersCommunicationEmailsServiceProvider extends ServiceProvider
{
    protected $moduleName = 'CustomersCommunicationEmails';
    protected $moduleNameLower = 'customerscommunicationemails';

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
