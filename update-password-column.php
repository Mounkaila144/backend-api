<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "🔧 Modification de la colonne password\n";
echo "=====================================\n\n";

$tenant = Tenant::where('site_host', 'tenant1.local')->first();

if (!$tenant) {
    echo "❌ Tenant non trouvé\n";
    exit(1);
}

echo "✅ Tenant: {$tenant->site_host} -> {$tenant->site_db_name}\n\n";

tenancy()->initialize($tenant);

echo "📋 Structure actuelle de la colonne password:\n";
$columns = DB::connection('tenant')->select("SHOW COLUMNS FROM t_users WHERE Field = 'password'");
foreach ($columns as $col) {
    echo "   - Type: {$col->Type}\n";
    echo "   - Null: {$col->Null}\n";
    echo "   - Key: {$col->Key}\n";
    echo "   - Default: {$col->Default}\n\n";
}

echo "🔄 Modification de la colonne password: varchar(32) -> varchar(255)...\n";

try {
    // Désactiver temporairement le mode strict
    DB::connection('tenant')->statement("SET SESSION sql_mode = ''");

    DB::connection('tenant')->statement("ALTER TABLE t_users MODIFY COLUMN password VARCHAR(255) NOT NULL");

    // Réactiver le mode strict
    DB::connection('tenant')->statement("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");

    echo "✅ Colonne password modifiée avec succès!\n\n";

    echo "📋 Nouvelle structure:\n";
    $columns = DB::connection('tenant')->select("SHOW COLUMNS FROM t_users WHERE Field = 'password'");
    foreach ($columns as $col) {
        echo "   - Type: {$col->Type}\n\n";
    }

    echo "💡 Vous pouvez maintenant exécuter:\n";
    echo "   php migrate-password.php\n";
} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
