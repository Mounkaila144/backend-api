<?php

return [
    'name' => 'Superadmin',

    /*
    |--------------------------------------------------------------------------
    | Module Configuration
    |--------------------------------------------------------------------------
    | Configuration de base du module SuperAdmin pour la gestion
    | des modules et services tenants
    */

    'timeouts' => [
        'module_activation' => 120,  // Timeout en secondes pour l'activation d'un module
        'health_check' => 30,        // Timeout pour les health checks
        'migration' => 300,          // Timeout pour les migrations
    ],

    'rate_limits' => [
        'api_requests' => 60,        // Requêtes par minute
        'batch_operations' => 10,    // Opérations batch par minute
    ],

    'cache' => [
        'module_list_ttl' => 300,    // Cache de la liste des modules en secondes
        'health_check_ttl' => 60,    // Cache des health checks
    ],
];
