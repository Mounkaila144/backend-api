<?php

return [
    'name' => 'AppDomoprimeYousignEvidence',

    /*
    |--------------------------------------------------------------------------
    | Yousign Evidence API V3
    |--------------------------------------------------------------------------
    |
    | Per-tenant credentials live in t_yousign_evidence_settings (1 row).
    | These config values are fallbacks / global toggles only.
    |
    */
    'api' => [
        'base_url' => env('YOUSIGN_EVIDENCE_BASE_URL', 'https://api.yousign.app/v3'),
        'sandbox_base_url' => env('YOUSIGN_EVIDENCE_SANDBOX_BASE_URL', 'https://api-sandbox.yousign.app/v3'),
        'webhook_secret' => env('YOUSIGN_EVIDENCE_WEBHOOK_SECRET'),
        'timeout' => 30,
    ],
];
