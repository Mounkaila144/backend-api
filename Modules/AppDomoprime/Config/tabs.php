<?php
return [
    'dashboard-site-customers-contract-view' => [
        '03-requests' => [
            'title' => 'Requests',
            'icon' => 'ri-mail-send-line',
            'component' => 'contract-requests',
            'credentials' => [['superadmin', 'admin', 'app_domoprime_contract_view_requests']],
        ],
        '04-factures' => [
            'title' => 'Factures',
            'icon' => 'ri-bill-line',
            'component' => 'contract-billing',
            'credentials' => [['superadmin', 'admin', 'app_domoprime_contract_view_billing']],
        ],
        '05-avoirs' => [
            'title' => 'Avoirs',
            'icon' => 'ri-refund-2-line',
            'component' => 'contract-billing-assets',
            'credentials' => [['superadmin', 'admin', 'app_domoprime_contract_view_asset']],
        ],
    ],
];
