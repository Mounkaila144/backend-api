<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    // Sanctum tries each guard in order. Session guards return null silently when their
    // session key is absent, so listing both is safe: an admin-only session resolves
    // through 'admin', a superadmin-only session falls through to 'superadmin'.
    'guard' => ['admin', 'superadmin', 'web'],

    'expiration' => env('SANCTUM_EXPIRATION', 60),

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        // SPA pipeline: AuthenticateSession is replaced by a no-op because it eagerly
        // resolves the user (and thus touches the tenant DB) before InitializeTenancy
        // has a chance to set up the tenant connection. The user is still resolved later
        // by the route's auth:sanctum middleware, which fires AFTER tenant init.
        'authenticate_session' => App\Http\Middleware\NoOpMiddleware::class,
        'encrypt_cookies'      => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token'  => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
