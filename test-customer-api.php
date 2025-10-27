<?php

/**
 * Quick test script for Customer API
 * Run with: php test-customer-api.php
 */

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Modules\Customer\Entities\Customer;
use Illuminate\Support\Facades\DB;

echo "=== Customer API Test ===\n\n";

try {
    // Test 1: Count customers in database
    echo "Test 1: Counting active customers...\n";
    $count = Customer::active()->count();
    echo "✓ Found {$count} active customers\n\n";

    // Test 2: Get first 5 customers
    echo "Test 2: Fetching first 5 customers...\n";
    $customers = Customer::active()
        ->with(['union', 'addresses'])
        ->take(5)
        ->get();

    foreach ($customers as $customer) {
        echo "  - ID: {$customer->id}\n";
        echo "    Name: {$customer->display_name}\n";
        echo "    Email: {$customer->email}\n";
        echo "    Phone: {$customer->phone}\n";
        echo "    Mobile: {$customer->mobile}\n";
        echo "    Created: {$customer->created_at}\n";
        echo "\n";
    }

    // Test 3: Check if table exists
    echo "Test 3: Checking database tables...\n";
    $tables = [
        't_customers',
        't_customers_address',
        't_customers_contact',
        't_customers_house',
        't_customers_financial',
        't_customers_union',
    ];

    foreach ($tables as $table) {
        $exists = DB::getSchemaBuilder()->hasTable($table);
        $status = $exists ? '✓' : '✗';
        echo "  {$status} Table '{$table}' " . ($exists ? 'exists' : 'does not exist') . "\n";
    }

    echo "\n=== All tests completed successfully! ===\n";
} catch (\Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}
