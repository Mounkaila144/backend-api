<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Legacy Symfony 1 Project Path
    |--------------------------------------------------------------------------
    |
    | Path to the old Symfony 1 project containing the sites/ directory
    | with tenant files.
    |
    | Structure attendue:
    | {legacy_path}/sites/{site_id}/admin/data/{module}/{type}/{entity_id}/{file}
    |
    */

    'legacy_path' => env('LEGACY_PROJECT_PATH', 'C:/xampp/htdocs/project'),

    /*
    |--------------------------------------------------------------------------
    | Auto Migration
    |--------------------------------------------------------------------------
    |
    | When enabled, files accessed via LegacyFileResolver will be automatically
    | migrated to S3 on first access. This allows for gradual migration
    | without downtime.
    |
    */

    'auto_migrate' => env('MIGRATION_AUTO_MIGRATE', false),

    /*
    |--------------------------------------------------------------------------
    | Site to Tenant ID Mapping
    |--------------------------------------------------------------------------
    |
    | Custom mapping between Symfony site names and Laravel tenant IDs.
    | By default, site_theme{N} maps to tenant ID {N}.
    |
    | Add custom mappings here for sites that don't follow the convention:
    | 'site_custom' => 123,
    |
    */

    'site_mapping' => [
        // 'site_custom_name' => 123,
        // 'site_special' => 456,
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Mapping
    |--------------------------------------------------------------------------
    |
    | Mapping between Symfony module names and Laravel module names.
    | This is used when converting paths between the two systems.
    |
    */

    'module_mapping' => [
        'customers' => 'customers',
        'customers_contracts' => 'contracts',
        'customers_contracts_documents' => 'contracts',
        'customers_documents' => 'customers',
        'customers_meetings' => 'meetings',
        'customers_communication' => 'communication',
        'customers_communication_emails' => 'emails',
        'users' => 'users',
        'products' => 'products',
        'services' => 'services',
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Tables for Path Updates
    |--------------------------------------------------------------------------
    |
    | When migrating files, these database tables will be updated
    | to reflect the new file paths.
    |
    | Format: 'module' => [
    |     'table' => 'table_name',
    |     'column' => 'file_path_column',
    |     'id_column' => 'entity_id_column',
    | ]
    |
    */

    'database_mappings' => [
        'customers' => [
            'table' => 't_customers_documents',
            'column' => 'file_path',
            'id_column' => 'customer_id',
        ],
        'users' => [
            'table' => 't_users',
            'column' => 'picture',
            'id_column' => 'id',
        ],
        'contracts' => [
            'table' => 't_customers_contracts_documents',
            'column' => 'file_path',
            'id_column' => 'contract_id',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Excluded Patterns
    |--------------------------------------------------------------------------
    |
    | File patterns to exclude from migration.
    | Uses glob patterns.
    |
    */

    'excluded_patterns' => [
        '*.tmp',
        '*.bak',
        '.gitkeep',
        '.DS_Store',
        'Thumbs.db',
    ],

    /*
    |--------------------------------------------------------------------------
    | Max File Size
    |--------------------------------------------------------------------------
    |
    | Maximum file size to migrate in bytes.
    | Files larger than this will be skipped and logged.
    |
    */

    'max_file_size' => env('MIGRATION_MAX_FILE_SIZE', 100 * 1024 * 1024), // 100 MB

    /*
    |--------------------------------------------------------------------------
    | Batch Size
    |--------------------------------------------------------------------------
    |
    | Number of files to process in each batch during migration.
    | Lower values use less memory but may be slower.
    |
    */

    'batch_size' => env('MIGRATION_BATCH_SIZE', 100),

];
