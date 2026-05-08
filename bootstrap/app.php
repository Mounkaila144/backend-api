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
