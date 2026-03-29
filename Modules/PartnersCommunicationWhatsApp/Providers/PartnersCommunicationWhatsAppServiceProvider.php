<?php

namespace Modules\PartnersCommunicationWhatsApp\Providers;

use Illuminate\Support\ServiceProvider;

class PartnersCommunicationWhatsAppServiceProvider extends ServiceProvider
{
    protected $moduleName = 'PartnersCommunicationWhatsApp';
    protected $moduleNameLower = 'partnerscommunicationwhatsapp';

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
