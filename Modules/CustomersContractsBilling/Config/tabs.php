<?php
return [
    'dashboard-site-customers-contract-view' => [
        'customer-contracts-asset-billing' => [
            'title' => 'Assets',
            'icon' => 'ri-refund-2-line',
            'component' => 'contract-billing-assets-module',
            'credentials' => [['superadmin', 'admin', 'contract_billing_view_assets_list']],
        ],
        'customer-contracts-billing' => [
            'title' => 'Billing',
            'icon' => 'ri-bill-line',
            'component' => 'contract-billing-module',
            'credentials' => [['superadmin', 'admin', 'contract_billing_view_billing_list']],
        ],
        'customer-contracts-billing-payments' => [
            'title' => 'Payments',
            'icon' => 'ri-bank-card-line',
            'component' => 'contract-billing-payments',
            'credentials' => [['superadmin', 'admin', 'contract_billing_view_payment_list']],
        ],
        'customer-contracts-paid-billing' => [
            'title' => 'Paid Bills',
            'icon' => 'ri-checkbox-circle-line',
            'component' => 'contract-billing-paid',
            'credentials' => [['superadmin', 'admin', 'contract_billing_view_paid_list']],
        ],
        'customers-contract-billings-and-payments' => [
            'title' => 'Bills/Payments',
            'icon' => 'ri-money-dollar-circle-line',
            'component' => 'contract-billing-payments-combined',
            'credentials' => [['superadmin', 'admin', 'contract_billing_payment_list']],
        ],
    ],
];
