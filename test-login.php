<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use App\Models\User as SuperadminUser;
use Modules\UsersGuard\Entities\User as TenantUser;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "🔐 Test de connexion\n";
echo "==================\n\n";

$username = 'superadmin';
$password = '123';

// Test 1: Connexion SUPERADMIN (base centrale)
echo "📍 Test 1: Connexion SUPERADMIN (base centrale site_dev1)\n";
echo str_repeat("-", 60) . "\n";

try {
    $superadminUser = DB::connection('mysql')
        ->table('t_users')
        ->where('username', $username)
        ->where('application', 'superadmin')
        ->first();

    if ($superadminUser) {
        echo "✅ Utilisateur trouvé:\n";
        echo "   - ID: {$superadminUser->id}\n";
        echo "   - Username: {$superadminUser->username}\n";
        echo "   - Email: {$superadminUser->email}\n";
        echo "   - Application: {$superadminUser->application}\n";
        echo "   - Password hash (premiers 20 chars): " . substr($superadminUser->password, 0, 20) . "...\n";
        echo "   - Longueur du hash: " . strlen($superadminUser->password) . " caractères\n\n";

        // Test du mot de passe
        if (strlen($superadminUser->password) === 60 && Hash::check($password, $superadminUser->password)) {
            echo "✅ Mot de passe VALIDE (bcrypt)\n";
            echo "   👉 Route: POST http://api.local/api/superadmin/auth/login\n";
            echo "   👉 Body: {\"username\":\"$username\",\"password\":\"$password\"}\n";
        } elseif (strlen($superadminUser->password) === 32 && md5($password) === $superadminUser->password) {
            echo "⚠️  Mot de passe VALIDE (MD5 - ancien format)\n";
            echo "   ⚠️  ATTENTION: Le système utilise bcrypt, ce mot de passe ne fonctionnera pas!\n";
            echo "   💡 Solution: Migrer le mot de passe vers bcrypt\n";
        } else {
            echo "❌ Mot de passe INVALIDE\n";
        }
    } else {
        echo "❌ Aucun utilisateur 'superadmin' avec application='superadmin' trouvé dans la base centrale\n";
    }
} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 60) . "\n\n";

// Test 2: Connexion TENANT (base tenant)
echo "📍 Test 2: Connexion TENANT (base tenant site_theme32)\n";
echo str_repeat("-", 60) . "\n";

try {
    $tenant = Tenant::where('site_host', 'tenant1.local')->first();

    if (!$tenant) {
        echo "❌ Tenant 'tenant1.local' non trouvé\n";
    } else {
        echo "✅ Tenant trouvé: {$tenant->site_host} -> {$tenant->site_db_name}\n\n";

        tenancy()->initialize($tenant);

        $tenantUser = DB::connection('tenant')
            ->table('t_users')
            ->where('username', $username)
            ->where('application', 'admin')
            ->first();

        if ($tenantUser) {
            echo "✅ Utilisateur trouvé:\n";
            echo "   - ID: {$tenantUser->id}\n";
            echo "   - Username: {$tenantUser->username}\n";
            echo "   - Email: {$tenantUser->email}\n";
            echo "   - Application: {$tenantUser->application}\n";
            echo "   - Password hash (premiers 20 chars): " . substr($tenantUser->password, 0, 20) . "...\n";
            echo "   - Longueur du hash: " . strlen($tenantUser->password) . " caractères\n\n";

            // Test du mot de passe
            if (strlen($tenantUser->password) === 60 && Hash::check($password, $tenantUser->password)) {
                echo "✅ Mot de passe VALIDE (bcrypt)\n";
                echo "   👉 Route: POST http://tenant1.local/api/auth/login\n";
                echo "   👉 Body: {\"username\":\"$username\",\"password\":\"$password\",\"application\":\"admin\"}\n";
            } elseif (strlen($tenantUser->password) === 32 && md5($password) === $tenantUser->password) {
                echo "⚠️  Mot de passe VALIDE (MD5 - ancien format)\n";
                echo "   ⚠️  ATTENTION: Le système utilise bcrypt, ce mot de passe ne fonctionnera pas!\n";
                echo "   💡 Solution: Mettre à jour le mot de passe vers bcrypt\n\n";

                // Proposer de mettre à jour
                echo "   💡 Voulez-vous que je mette à jour ce mot de passe vers bcrypt? (Y/n): ";
                $handle = fopen("php://stdin", "r");
                $line = fgets($handle);
                if (trim($line) !== 'n' && trim($line) !== 'N') {
                    $newHash = Hash::make($password);
                    DB::connection('tenant')
                        ->table('t_users')
                        ->where('id', $tenantUser->id)
                        ->update(['password' => $newHash]);
                    echo "   ✅ Mot de passe mis à jour vers bcrypt!\n";
                    echo "   👉 Route: POST http://tenant1.local/api/auth/login\n";
                    echo "   👉 Body: {\"username\":\"$username\",\"password\":\"$password\",\"application\":\"admin\"}\n";
                }
                fclose($handle);
            } else {
                echo "❌ Mot de passe INVALIDE\n";
            }
        } else {
            echo "❌ Aucun utilisateur '$username' avec application='admin' trouvé dans le tenant\n";
        }
    }
} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 60) . "\n";