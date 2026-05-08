<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Hydrate les origines CORS autorisées depuis t_sites (cache 5 min).
        // DOIT être prepend pour s'exécuter avant HandleCors qui lit la config.
        $middleware->prepend(\App\Http\Middleware\PopulateCorsOrigins::class);

        // Sanctum SPA mode — for requests coming from any of the SANCTUM_STATEFUL_DOMAINS,
        // run the full web middleware (cookies, session, CSRF) on the api/* group so
        // session-based auth works. Stateless callers (Bearer tokens) are unaffected.
        $middleware->statefulApi();

        // Tenant init MUST run AFTER Sanctum's stateful pipeline (so the session is loaded
        // and we can read tenant_site_id from it for the cross-tenant pivot check) but
        // BEFORE Authenticate fires (so the tenant DB connection is registered before
        // SessionGuard tries to load the user from the tenant DB).
        //
        // Laravel reorders middleware via a priority list at runtime, so we MUST inject
        // InitializeTenancy into that list — otherwise Authenticate (priority 6) would be
        // moved ahead of InitializeTenancy (no priority) and the user query would fail
        // with "Database connection [tenant] not configured".
        $middleware->priority([
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\InitializeTenancy::class,
            \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class,
            \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
            \Illuminate\Contracts\Session\Middleware\AuthenticatesSessions::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \Illuminate\Auth\Middleware\Authorize::class,
        ]);

        // Middleware global pour la détection automatique de la langue
        $middleware->append(\App\Http\Middleware\SetLocale::class);

        // Enregistrer les alias middleware
        $middleware->alias([
            'tenant' => \App\Http\Middleware\InitializeTenancy::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'credential' => \App\Http\Middleware\CheckCredential::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
