<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "📋 Création de la table personal_access_tokens (base centrale)\n";
echo "==============================================================\n\n";

// Vérifier si la table existe
$exists = count(DB::connection('mysql')->select("SHOW TABLES LIKE 'personal_access_tokens'")) > 0;

if ($exists) {
    echo "✅ La table existe déjà dans la base centrale\n";
    exit(0);
}

echo "⚠️  Table n'existe pas dans la base centrale\n";
echo "🔧 Création de la table...\n\n";

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

try {
    DB::connection('mysql')->statement($createTableSQL);
    echo "✅ Table personal_access_tokens créée avec succès dans la base centrale!\n\n";

    $columns = DB::connection('mysql')->select("SHOW COLUMNS FROM personal_access_tokens");
    echo "📋 Colonnes créées:\n";
    foreach ($columns as $col) {
        echo "   - {$col->Field} ({$col->Type})\n";
    }

    echo "\n🎉 Le superadmin peut maintenant se connecter!\n";
    echo "   POST http://api.local/api/superadmin/auth/login\n";

} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
