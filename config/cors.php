<?php

/**
 * CORS configuration.
 *
 * Tightening notes:
 * - allowed_methods / allowed_headers are explicit lists (no '*'). With
 *   supports_credentials=true, '*' is rejected by browsers anyway and broadens
 *   the surface for nothing.
 * - allowed_origins accepts a comma-separated FRONTEND_URL so you can register
 *   admin/front/superadmin hosts in a single env var without code changes.
 * - max_age moved to 86400 so browsers cache preflight responses for a day
 *   instead of re-issuing OPTIONS on every API call.
 */

$frontendUrls = array_filter(
    array_map('trim', explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000')))
);

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $frontendUrls,

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-CSRF-TOKEN',
        'X-Requested-With',
        'X-Tenant-ID',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => ['X-Tenant-ID'],

    'max_age' => 86400,

    'supports_credentials' => true,
];
