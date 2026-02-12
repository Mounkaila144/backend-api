<?php

namespace Modules\PartnerPolluter\Providers;

use Illuminate\Support\ServiceProvider;

class PartnerPolluterServiceProvider extends ServiceProvider
{
    protected $moduleName = 'PartnerPolluter';
    protected $moduleNameLower = 'partnerpolluter';

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
