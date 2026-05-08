<?php

namespace Modules\AppDomoprimeYousignEvidence\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    protected $moduleNamespace = 'Modules\AppDomoprimeYousignEvidence\Http\Controllers';

    public function boot(): void
    {
        parent::boot();
    }
}
