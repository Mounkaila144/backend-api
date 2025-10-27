<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "📋 Création de la table personal_access_tokens\n";
echo "==============================================\n\n";

// Vérifier dans la base centrale
echo "🔍 Vérification base centrale (site_dev1)...\n";
$centralExists = count(DB::connection('mysql')->select("SHOW TABLES LIKE 'personal_access_tokens'")) > 0;

if ($centralExists) {
    echo "✅ Table existe dans la base centrale\n";

    // Récupérer la structure
    $createStatement = DB::connection('mysql')->select("SHOW CREATE TABLE personal_access_tokens")[0];
    $createTableSQL = $createStatement->{'Create Table'};
    echo "\n📋 Structure SQL récupérée\n\n";
} else {
    echo "⚠️  Table n'existe pas dans la base centrale\n";
    echo "💡 Utilisation de la structure standard Laravel Sanctum\n\n";

    // Structure standard de Laravel Sanctum
    $createTableSQL = "CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
}

// Initialiser le tenant
echo "🔍 Initialisation du tenant tenant1.local...\n";
$tenant = Tenant::where('site_host', 'tenant1.local')->first();

if (!$tenant) {
    echo "❌ Tenant non trouvé\n";
    exit(1);
}

echo "✅ Tenant: {$tenant->site_host} -> {$tenant->site_db_name}\n\n";

tenancy()->initialize($tenant);

// Vérifier si la table existe déjà
echo "🔍 Vérification dans la base tenant...\n";
$tenantExists = count(DB::connection('tenant')->select("SHOW TABLES LIKE 'personal_access_tokens'")) > 0;

if ($tenantExists) {
    echo "✅ La table existe déjà dans la base tenant\n";
    exit(0);
}

echo "⚠️  Table n'existe pas dans la base tenant\n";
echo "🔧 Création de la table...\n\n";

try {
    DB::connection('tenant')->statement($createTableSQL);
    echo "✅ Table personal_access_tokens créée avec succès!\n\n";

    // Vérifier la création
    $columns = DB::connection('tenant')->select("SHOW COLUMNS FROM personal_access_tokens");
    echo "📋 Colonnes créées:\n";
    foreach ($columns as $col) {
        echo "   - {$col->Field} ({$col->Type})\n";
    }

    echo "\n🎉 Vous pouvez maintenant tester la connexion dans Postman!\n";
    echo "   POST http://tenant1.local/api/auth/login\n";

} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
