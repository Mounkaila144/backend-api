<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔍 Vérification de la configuration des tenants...\n\n";

// Liste tous les tenants dans la base centrale
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TENANTS ENREGISTRÉS DANS LA BASE CENTRALE\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$tenants = DB::connection('mysql')->table('t_sites')
    ->select('site_id', 'site_host', 'site_db_name', 'site_db_host', 'site_available')
    ->orderBy('site_id')
    ->get();

if ($tenants->isEmpty()) {
    echo "❌ Aucun tenant trouvé dans la table t_sites!\n\n";
    echo "Vous devez ajouter des tenants dans la base centrale.\n";
    exit(1);
}

foreach ($tenants as $tenant) {
    echo "ID: {$tenant->site_id}\n";
    echo "  Domaine: {$tenant->site_host}\n";
    echo "  Base de données: {$tenant->site_db_name}\n";
    echo "  Hôte DB: {$tenant->site_db_host}\n";
    echo "  Disponible: {$tenant->site_available}\n";
    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Vérifier si tenant1.local existe
echo "🔍 Recherche du domaine 'tenant1.local'...\n\n";

$tenant1 = DB::connection('mysql')->table('t_sites')
    ->where('site_host', 'tenant1.local')
    ->first();

if (!$tenant1) {
    echo "❌ Le domaine 'tenant1.local' n'est PAS enregistré!\n\n";
    echo "Pour créer ce tenant, vous pouvez :\n";
    echo "1. Utiliser le script create-tenant.php (à créer)\n";
    echo "2. Insérer manuellement dans la base de données\n";
    echo "3. Utiliser l'API superadmin de création de tenant\n\n";

    // Proposer de créer automatiquement
    echo "Voulez-vous créer automatiquement tenant1.local ?\n";
    echo "Configuration proposée:\n";
    echo "  - Domaine: tenant1.local\n";
    echo "  - Base de données: tenant1_db\n";
    echo "  - Hôte DB: 127.0.0.1\n";
    echo "  - Disponible: YES\n\n";
} else {
    echo "✅ Le domaine 'tenant1.local' est enregistré!\n\n";
    echo "Configuration:\n";
    echo "  ID: {$tenant1->site_id}\n";
    echo "  Domaine: {$tenant1->site_host}\n";
    echo "  Base de données: {$tenant1->site_db_name}\n";
    echo "  Hôte DB: {$tenant1->site_db_host}\n";
    echo "  Disponible: {$tenant1->site_available}\n\n";

    // Vérifier la connexion à la base tenant
    echo "🔍 Test de connexion à la base tenant...\n";

    try {
        $tenant = \App\Models\Tenant::find($tenant1->site_id);
        if ($tenant) {
            tenancy()->initialize($tenant);

            // Tester la connexion
            $userCount = DB::connection('tenant')->table('t_users')->count();
            echo "✅ Connexion réussie à la base tenant!\n";
            echo "  Nombre d'utilisateurs: {$userCount}\n\n";

            // Lister quelques utilisateurs
            $users = DB::connection('tenant')->table('t_users')
                ->select('id', 'username', 'email', 'application', 'is_active')
                ->where('application', 'admin')
                ->limit(5)
                ->get();

            if ($users->isNotEmpty()) {
                echo "Utilisateurs disponibles:\n";
                foreach ($users as $user) {
                    echo "  - ID: {$user->id}, Username: {$user->username}, Email: {$user->email}, Active: {$user->is_active}\n";
                }
            }

            tenancy()->end();
        }
    } catch (\Exception $e) {
        echo "❌ Erreur de connexion à la base tenant: {$e->getMessage()}\n";
    }
}

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
