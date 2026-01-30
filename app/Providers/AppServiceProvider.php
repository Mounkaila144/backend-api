<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configurer les rate limiters pour l'API
        $this->configureRateLimiting();
    }

    /**
     * Configure rate limiting for API endpoints
     */
    protected function configureRateLimiting(): void
    {
        // Rate limiter pour les endpoints de lecture SuperAdmin (100 requêtes/minute)
        RateLimiter::for('superadmin-read', function ($request) {
            return Limit::perMinute(100)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiter pour les opérations lourdes SuperAdmin (10 requêtes/minute)
        RateLimiter::for('superadmin-heavy', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiter API général (60 requêtes/minute)
        RateLimiter::for('api', function ($request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiter superadmin-write (20 requêtes/minute)
        RateLimiter::for('superadmin-write', function ($request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });
    }
}
