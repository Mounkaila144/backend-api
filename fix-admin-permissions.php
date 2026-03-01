<?php

/**
 * Fix: Add 'admin' and 'superadmin' permissions to groups that have the matching application field.
 *
 * Root cause: In Symfony 1, hasCredential('admin') checks PERMISSIONS (not group names).
 * Groups with application='admin' should have the 'admin' permission so that
 * hasCredential('admin') returns true for users in those groups.
 *
 * This script also creates missing permissions referenced in FIELD_PERMISSIONS.
 *
 * Usage: php fix-admin-permissions.php
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$site = \App\Models\Tenant::where('site_host', 'tenant1.local')->first();
if (!$site) {
    echo "ERROR: Tenant 'tenant1.local' not found\n";
    exit(1);
}

echo "Initializing tenant: {$site->site_id} ({$site->site_db_name})\n";
tenancy()->initialize($site);

// ─── Step 1: Add 'admin' permission to all groups with application='admin' ───

$adminPermission = DB::table('t_permissions')->where('name', 'admin')->first();
$superadminPermission = DB::table('t_permissions')->where('name', 'superadmin')->first();

if (!$adminPermission) {
    echo "WARNING: 'admin' permission does not exist in t_permissions. Creating...\n";
    $adminPermId = DB::table('t_permissions')->insertGetId([
        'name' => 'admin',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Created 'admin' permission with id={$adminPermId}\n";
} else {
    $adminPermId = $adminPermission->id;
    echo "Found 'admin' permission: id={$adminPermId}\n";
}

if (!$superadminPermission) {
    echo "WARNING: 'superadmin' permission does not exist. Creating...\n";
    $superadminPermId = DB::table('t_permissions')->insertGetId([
        'name' => 'superadmin',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Created 'superadmin' permission with id={$superadminPermId}\n";
} else {
    $superadminPermId = $superadminPermission->id;
    echo "Found 'superadmin' permission: id={$superadminPermId}\n";
}

// Add 'admin' permission to all groups with application='admin'
$adminGroups = DB::table('t_groups')
    ->where('application', 'admin')
    ->where('is_active', 'YES')
    ->get(['id', 'name']);

$addedCount = 0;
foreach ($adminGroups as $group) {
    $exists = DB::table('t_group_permission')
        ->where('group_id', $group->id)
        ->where('permission_id', $adminPermId)
        ->exists();

    if (!$exists) {
        DB::table('t_group_permission')->insert([
            'group_id' => $group->id,
            'permission_id' => $adminPermId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "  + Added 'admin' perm to group #{$group->id} '{$group->name}'\n";
        $addedCount++;
    }
}
echo "Added 'admin' permission to {$addedCount} groups (out of " . count($adminGroups) . " admin groups)\n\n";

// Add 'superadmin' permission to all groups with application='superadmin'
$superadminGroups = DB::table('t_groups')
    ->where('application', 'superadmin')
    ->where('is_active', 'YES')
    ->get(['id', 'name']);

$addedCount = 0;
foreach ($superadminGroups as $group) {
    $exists = DB::table('t_group_permission')
        ->where('group_id', $group->id)
        ->where('permission_id', $superadminPermId)
        ->exists();

    if (!$exists) {
        DB::table('t_group_permission')->insert([
            'group_id' => $group->id,
            'permission_id' => $superadminPermId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "  + Added 'superadmin' perm to group #{$group->id} '{$group->name}'\n";
        $addedCount++;
    }
}
echo "Added 'superadmin' permission to {$addedCount} groups (out of " . count($superadminGroups) . " superadmin groups)\n\n";

// ─── Step 2: Create missing permissions ────────────────────────────────

$missingPermissions = [
    'contract_list_opened_at',
    'contract_list_view_lastname',
    'contract_list_view_doc_at',
];

foreach ($missingPermissions as $permName) {
    $exists = DB::table('t_permissions')->where('name', $permName)->exists();
    if (!$exists) {
        $id = DB::table('t_permissions')->insertGetId([
            'name' => $permName,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "Created missing permission '{$permName}' (id={$id})\n";
    } else {
        echo "Permission '{$permName}' already exists\n";
    }
}

// ─── Step 3: Verify the fix for user #341 ──────────────────────────────

echo "\n=== VERIFICATION ===\n";
$user = \Modules\UsersGuard\Entities\User::find(341);
if ($user) {
    $user->clearPermissionCache();
    $user->load(['groups.permissions']);

    echo "User #341: {$user->lastname} {$user->firstname}\n";
    echo "hasCredential('admin'): " . ($user->hasCredential('admin') ? 'TRUE' : 'FALSE') . "\n";
    echo "hasCredential(['admin', 'contract_list_opened_at']): " . ($user->hasCredential(['admin', 'contract_list_opened_at']) ? 'TRUE' : 'FALSE') . "\n";
    echo "hasCredential(['superadmin', 'admin', 'contract_list_opc_at']): " . ($user->hasCredential(['superadmin', 'admin', 'contract_list_opc_at']) ? 'TRUE' : 'FALSE') . "\n";

    $permitted = \Modules\CustomersContracts\Http\Resources\ContractListResource::resolvePermittedFields($user);
    echo "\nPermitted fields (" . count($permitted) . "): " . implode(', ', $permitted) . "\n";

    $allFieldKeys = array_keys(\Modules\CustomersContracts\Http\Resources\ContractListResource::FIELD_PERMISSIONS);
    $missing = array_diff($allFieldKeys, $permitted);
    echo "Missing fields (" . count($missing) . "): " . implode(', ', $missing) . "\n";
} else {
    echo "User #341 not found\n";
}

tenancy()->end();
echo "\nDone!\n";
