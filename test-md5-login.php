<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Tenant;
use Modules\UsersGuard\Entities\User as TenantUser;

echo "🔐 Test de connexion MD5\n";
echo "========================\n\n";

$username = 'superadmin';
$password = '123';

// Initialiser le tenant
$tenant = Tenant::where('site_host', 'tenant1.local')->first();

if (!$tenant) {
    echo "❌ Tenant non trouvé\n";
    exit(1);
}

echo "✅ Tenant: {$tenant->site_host} -> {$tenant->site_db_name}\n\n";

tenancy()->initialize($tenant);

// Chercher l'utilisateur
echo "🔍 Recherche de l'utilisateur...\n";
$user = TenantUser::where('username', $username)
    ->where('application', 'admin')
    ->active()
    ->first();

if (!$user) {
    echo "❌ Utilisateur non trouvé ou inactif\n";

    // Diagnostique
    $userNoScope = TenantUser::where('username', $username)
        ->where('application', 'admin')
        ->first();

    if ($userNoScope) {
        echo "\n⚠️  Utilisateur trouvé mais:\n";
        echo "   - is_active: {$userNoScope->is_active}\n";
        echo "   - status: {$userNoScope->status}\n";
    }
    exit(1);
}

echo "✅ Utilisateur trouvé:\n";
echo "   - ID: {$user->id}\n";
echo "   - Username: {$user->username}\n";
echo "   - Email: {$user->email}\n";
echo "   - Application: {$user->application}\n";
echo "   - Password (20 premiers chars): " . substr($user->password, 0, 20) . "...\n";
echo "   - Longueur: " . strlen($user->password) . " caractères\n\n";

// Vérifier le mot de passe
echo "🔑 Test du mot de passe...\n";

if (strlen($user->password) === 32) {
    echo "   Format: MD5 (legacy)\n";
    if (md5($password) === $user->password) {
        echo "   ✅ Mot de passe VALIDE!\n\n";
    } else {
        echo "   ❌ Mot de passe INVALIDE\n";
        echo "   MD5 attendu: {$user->password}\n";
        echo "   MD5 fourni: " . md5($password) . "\n\n";
        exit(1);
    }
} else {
    echo "   ❌ Format de hash inconnu (longueur: " . strlen($user->password) . ")\n";
    exit(1);
}

echo "🎉 SUCCÈS! Vous pouvez maintenant tester avec Postman:\n\n";
echo "   Méthode: POST\n";
echo "   URL: http://tenant1.local/api/auth/login\n";
echo "   Headers:\n";
echo "      Content-Type: application/json\n\n";
echo "   Body (raw JSON):\n";
echo "   {\n";
echo "      \"username\": \"$username\",\n";
echo "      \"password\": \"$password\",\n";
echo "      \"application\": \"admin\"\n";
echo "   }\n";
