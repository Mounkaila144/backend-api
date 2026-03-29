<?php

// Tabs from customers_contracts module only (Symfony: modules/customers_contracts/admin/config/tabs.php)

return [
    'dashboard-site-customers-contract-view' => [
        'contract-10-products' => [
            'title' => 'Sold products',
            'icon' => 'ri-shopping-cart-line',
            'component' => 'contract-products',
            'credentials' => [['superadmin', 'admin', 'contract_products_list']],
        ],
        'contract-20-attributions' => [
            'title' => 'Attributions',
            'icon' => 'ri-team-line',
            'component' => 'contract-attributions',
            'credentials' => [['superadmin', 'admin', 'contract_attributions_list']],
        ],
        'contract-20-attributions2' => [
            'title' => '[Attributions]',
            'icon' => 'ri-user-settings-line',
            'component' => 'contract-attributions-team',
            'credentials' => [['superadmin', 'contract_attributions_list_with_team']],
        ],
        // Carte (hardcoded in Symfony template, always visible)
        'zz-carte' => [
            'title' => 'Carte',
            'icon' => 'ri-map-pin-line',
            'component' => 'contract-map',
        ],
    ],
];
