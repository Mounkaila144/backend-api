<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

$tenant = Tenant::where('site_host', 'tenant1.local')->first();

if (!$tenant) {
    echo "❌ Tenant 'tenant1.local' non trouvé dans t_sites\n";
    exit(1);
}

echo "✅ Tenant trouvé: {$tenant->site_host} -> {$tenant->site_db_name}\n\n";

try {
    tenancy()->initialize($tenant);

    // D'abord, vérifier les colonnes disponibles
    $columns = DB::connection('tenant')
        ->select("SHOW COLUMNS FROM t_users");

    echo "📋 Colonnes de t_users:\n";
    foreach ($columns as $col) {
        echo "  - {$col->Field} ({$col->Type})\n";
    }
    echo "\n";

    $users = DB::connection('tenant')
        ->table('t_users')
        ->select('id', 'username', 'email', 'application')
        ->limit(5)
        ->get();

    if ($users->isEmpty()) {
        echo "⚠️ Aucun utilisateur trouvé dans la base {$tenant->site_db_name}\n";
    } else {
        echo "👥 Utilisateurs trouvés ({$users->count()}):\n";
        foreach ($users as $user) {
            echo sprintf(
                "  - ID:%d | Username:%s | Email:%s | App:%s\n",
                $user->id,
                $user->username,
                $user->email ?? 'N/A',
                $user->application
            );
        }
    }
} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}