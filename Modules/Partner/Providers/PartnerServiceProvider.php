<?php

namespace Modules\Partner\Providers;

use Illuminate\Support\ServiceProvider;

class PartnerServiceProvider extends ServiceProvider
{
    protected $moduleName = 'Partner';
    protected $moduleNameLower = 'partner';

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
