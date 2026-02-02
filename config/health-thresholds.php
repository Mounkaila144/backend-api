<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Health Check Cache TTL
    |--------------------------------------------------------------------------
    |
    | Define how long health check results should be cached to avoid
    | overloading services with repeated checks.
    |
    */

    'cache' => [
        'ttl' => env('HEALTH_CACHE_TTL', 30), // 30 secondes par défaut
    ],

    /*
    |--------------------------------------------------------------------------
    | Health Check Latency Thresholds
    |--------------------------------------------------------------------------
    |
    | Define latency thresholds for each service to determine their status:
    | - healthy: latency < healthy threshold (green)
    | - degraded: healthy < latency <= degraded threshold (yellow)
    | - unhealthy: latency > degraded threshold OR connection failed (red)
    |
    | All values are in milliseconds (ms)
    |
    */

    'latency' => [
        's3' => [
            'healthy' => 500,    // < 500ms
            'degraded' => 2000,  // < 2000ms
        ],
        'database' => [
            'healthy' => 100,    // < 100ms
            'degraded' => 500,   // < 500ms
        ],
        'redis-cache' => [
            'healthy' => 50,     // < 50ms
            'degraded' => 200,   // < 200ms
        ],
        'redis-queue' => [
            'healthy' => 50,     // < 50ms
            'degraded' => 200,   // < 200ms
        ],
        'ses' => [
            'healthy' => 500,    // < 500ms
            'degraded' => 2000,  // < 2000ms
        ],
        'meilisearch' => [
            'healthy' => 200,    // < 200ms
            'degraded' => 1000,  // < 1000ms
        ],
    ],
];
