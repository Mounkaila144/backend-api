<?php

namespace Modules\AppDomoprimeISO3\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    protected $moduleNamespace = 'Modules\AppDomoprimeISO3\Http\Controllers';

    public function boot(): void
    {
        parent::boot();
    }
}
