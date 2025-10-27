<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🧪 TEST : Identification du Tenant par Domaine\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Liste des domaines à tester
$domains = [
    'api.local',
    'tenant1.local',
    'tenant2.local', // N'existe pas
];

foreach ($domains as $domain) {
    echo "📍 Test du domaine: $domain\n";
    echo str_repeat('-', 60) . "\n";

    // Chercher le tenant par domaine dans la base centrale
    $tenant = DB::connection('mysql')
        ->table('t_sites')
        ->where('site_host', $domain)
        ->where('site_available', 'YES')
        ->first();

    if ($tenant) {
        echo "✅ Tenant trouvé!\n";
        echo "   ID: {$tenant->site_id}\n";
        echo "   Domaine: {$tenant->site_host}\n";
        echo "   Base de données: {$tenant->site_db_name}\n";
        echo "   Disponible: {$tenant->site_available}\n\n";

        // Initialiser le tenant
        try {
            $tenantModel = \App\Models\Tenant::find($tenant->site_id);
            if ($tenantModel) {
                tenancy()->initialize($tenantModel);

                // Compter les utilisateurs
                $userCount = DB::connection('tenant')->table('t_users')->count();
                echo "   📊 Nombre d'utilisateurs dans cette base: {$userCount}\n";

                // Lister quelques utilisateurs
                $users = DB::connection('tenant')
                    ->table('t_users')
                    ->select('id', 'username', 'application')
                    ->limit(3)
                    ->get();

                if ($users->isNotEmpty()) {
                    echo "   👥 Exemples d'utilisateurs:\n";
                    foreach ($users as $user) {
                        echo "      - ID: {$user->id}, Username: {$user->username}, App: {$user->application}\n";
                    }
                }

                tenancy()->end();
            }
        } catch (\Exception $e) {
            echo "   ❌ Erreur lors de l'initialisation: {$e->getMessage()}\n";
        }
    } else {
        echo "❌ Tenant non trouvé pour ce domaine!\n";
    }

    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "COMMENT ÇA FONCTIONNE:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "1. Le middleware InitializeTenancy lit le domaine du header 'Host'\n";
echo "   Exemple: Host: tenant1.local\n\n";

echo "2. Il cherche dans la table t_sites (base centrale) :\n";
echo "   SELECT * FROM t_sites WHERE site_host = 'tenant1.local' AND site_available = 'YES'\n\n";

echo "3. Si trouvé, il récupère les infos de connexion:\n";
echo "   - site_db_name (nom de la base)\n";
echo "   - site_db_host (hôte MySQL)\n";
echo "   - site_db_login (utilisateur)\n";
echo "   - site_db_password (mot de passe)\n\n";

echo "4. Il initialise la connexion 'tenant' vers cette base\n\n";

echo "5. Toutes les requêtes Eloquent utilisent automatiquement la bonne base!\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "COMMENT TESTER AVEC POSTMAN:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "Option 1: Par domaine (automatique)\n";
echo "  URL: http://tenant1.local/api/admin/users\n";
echo "  Headers:\n";
echo "    Authorization: Bearer [TOKEN]\n";
echo "    Accept: application/json\n\n";

echo "Option 2: Par header X-Tenant-ID (si domaine non disponible)\n";
echo "  URL: http://localhost/api/admin/users\n";
echo "  Headers:\n";
echo "    Authorization: Bearer [TOKEN]\n";
echo "    Accept: application/json\n";
echo "    X-Tenant-ID: 75\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
