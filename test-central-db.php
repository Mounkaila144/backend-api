<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Tester connexion centrale
    $pdo = DB::connection('mysql')->getPdo();
    echo "✅ Connexion à la base CENTRALE réussie!\n";

    // Vérifier que t_sites existe
    $tables = DB::connection('mysql')->select('SHOW TABLES');
    $tableNames = array_map(fn($t) => array_values((array) $t)[0], $tables);

    if (in_array('t_sites', $tableNames)) {
        echo "✅ Table t_sites trouvée!\n\n";

        // Lister les sites
        $sites = DB::connection('mysql')->table('t_sites')->get();
        echo "📋 Sites dans la base:\n";
        foreach ($sites as $site) {
            echo "  - {$site->site_host} → {$site->site_db_name} ({$site->site_available})\n";
        }
    } else {
        echo "⚠️  Table t_sites non trouvée. Voici les tables disponibles:\n";
        foreach (array_slice($tableNames, 0, 10) as $table) {
            echo "  - $table\n";
        }
    }

} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

