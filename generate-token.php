<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Configuration
$tenantId = 75; // ID du tenant (tenant1.local)
$username = 'admin'; // Username de l'utilisateur

echo "🔍 Recherche de l'utilisateur '$username' pour le tenant $tenantId...\n\n";

// Initialiser le tenant
try {
    $tenant = \App\Models\Tenant::find($tenantId);
    if (!$tenant) {
        echo "❌ Tenant #$tenantId introuvable!\n";
        exit(1);
    }

    echo "✅ Tenant trouvé: {$tenant->site_host}\n";

    // Initialiser la connexion tenant
    tenancy()->initialize($tenant);

    // Chercher l'utilisateur dans la base tenant
    $user = DB::connection('tenant')
        ->table('t_users')
        ->where('username', $username)
        ->where('application', 'admin')
        ->first();

    if (!$user) {
        echo "❌ Utilisateur '$username' introuvable dans la base tenant!\n";
        echo "\nUtilisateurs disponibles:\n";
        $users = DB::connection('tenant')
            ->table('t_users')
            ->where('application', 'admin')
            ->select('id', 'username', 'email', 'is_active')
            ->get();
        foreach ($users as $u) {
            echo "  - ID: {$u->id}, Username: {$u->username}, Email: {$u->email}, Active: {$u->is_active}\n";
        }
        exit(1);
    }

    echo "✅ Utilisateur trouvé:\n";
    echo "   ID: {$user->id}\n";
    echo "   Username: {$user->username}\n";
    echo "   Email: {$user->email}\n";
    echo "   Active: {$user->is_active}\n\n";

    // Charger le modèle User complet
    $userModel = \Modules\UsersGuard\Entities\User::find($user->id);

    if (!$userModel) {
        echo "❌ Impossible de charger le modèle User!\n";
        exit(1);
    }

    // Générer un nouveau token
    echo "🔑 Génération d'un nouveau token...\n";
    $token = $userModel->createToken('api-token', ['*']);

    echo "\n✅ Token généré avec succès!\n\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "Token à utiliser dans Postman:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo $token->plainTextToken . "\n\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    echo "Configuration Postman:\n";
    echo "1. Onglet Authorization\n";
    echo "   Type: Bearer Token\n";
    echo "   Token: {$token->plainTextToken}\n\n";

    echo "2. Onglet Headers\n";
    echo "   Host: {$tenant->site_host}\n";
    echo "   Accept: application/json\n\n";

    echo "3. URL de test:\n";
    echo "   GET http://{$tenant->site_host}/api/admin/users\n\n";

    // Fin du tenant context
    tenancy()->end();

    echo "✅ Terminé!\n";

} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
