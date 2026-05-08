<?php

namespace Modules\UsersGuard\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The module namespace to assume when generating URLs to actions.
     */
    protected $moduleNamespace = 'Modules\UsersGuard\Http\Controllers';

    /**
     * Called before routes are registered.
     *
     * Register any model bindings or pattern based filters.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Define the routes for the application.
     */
    public function map(): void
    {
        $this->mapApiRoutes();
    }

    /**
     * Define the "api" routes for the application.
     *
     * These routes are typically stateless.
     */
    protected function mapApiRoutes(): void
    {
        // ->middleware('api') is required so the api group's EnsureFrontendRequestsAreStateful
        // runs and enables session/CSRF for stateful frontend requests (Sanctum SPA mode).
        Route::prefix('api')
            ->namespace($this->moduleNamespace)
            ->group(module_path('UsersGuard', '/Routes/admin.php'));

        Route::prefix('api')
            ->namespace($this->moduleNamespace)
            ->group(module_path('UsersGuard', '/Routes/superadmin.php'));

        Route::prefix('api')
            ->namespace($this->moduleNamespace)
            ->group(module_path('UsersGuard', '/Routes/frontend.php'));
    }
}
