<?php

namespace Modules\CustomersCommunicationWhatsApp\Providers;

use Illuminate\Support\ServiceProvider;

class CustomersCommunicationWhatsAppServiceProvider extends ServiceProvider
{
    protected $moduleName = 'CustomersCommunicationWhatsApp';
    protected $moduleNameLower = 'customerscommunicationwhatsapp';

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
