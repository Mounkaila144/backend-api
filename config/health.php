<?php

return [
    /*
     * A result store is responsible for saving the results of the health checks.
     */
    'result_stores' => [
        Spatie\Health\ResultStores\CacheHealthResultStore::class => [
            'store' => 'redis',
        ],
    ],

    /*
     * You can get notified when specific events occur.
     */
    'notifications' => [
        /*
         * Notifications will only get sent if this option is set to `true`.
         */
        'enabled' => false,
    ],

    /*
     * This determines how many seconds will pass before a new run of the checks.
     */
    'throttle_ttl_in_seconds' => 30,

    /*
     * The following checks will be run when the health check is executed.
     * Les checks sont enregistrés dynamiquement dans le SuperadminServiceProvider.
     */
    'checks' => [
        // Checks registered in SuperadminServiceProvider
    ],
];
