<?php

namespace Modules\PartnerLayer\Providers;

use Illuminate\Support\ServiceProvider;

class PartnerLayerServiceProvider extends ServiceProvider
{
    protected $moduleName = 'PartnerLayer';
    protected $moduleNameLower = 'partnerlayer';

    public function boot(): void
    {
        $this->mergeConfigFrom(
            module_path($this->moduleName, 'Config/config.php'),
            $this->moduleNameLower
        );
    }

    public function register(): void
    {
        //
    }
}
