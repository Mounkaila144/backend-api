<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Test des Sites ===\n\n";

$count = App\Models\Tenant::count();
echo "Nombre total de sites : $count\n\n";

if ($count > 0) {
    echo "Liste des sites :\n";
    $sites = App\Models\Tenant::select('site_id', 'site_host', 'site_db_name', 'site_available')->limit(5)->get();

    foreach ($sites as $site) {
        echo "  - ID: {$site->site_id}, Host: {$site->site_host}, DB: {$site->site_db_name}, Available: {$site->site_available}\n";
    }
} else {
    echo "Aucun site trouvé.\n";
}
