<?php
return [
    'dashboard-site-customers-contract-view' => [
        'customer-documents' => [
            'title' => 'Documents',
            'icon' => 'ri-folder-line',
            'component' => 'contract-documents',
            'credentials' => [['superadmin', 'contract_documents_list']],
        ],
    ],
];
