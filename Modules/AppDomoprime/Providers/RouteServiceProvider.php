<?php

namespace Modules\AppDomoprime\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    protected $moduleNamespace = 'Modules\AppDomoprime\Http\Controllers';

    public function boot(): void
    {
        parent::boot();
    }
}
