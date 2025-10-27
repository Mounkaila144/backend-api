<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "🔐 Migration du mot de passe vers bcrypt\n";
echo "========================================\n\n";

$username = 'superadmin';
$password = '123';

$tenant = Tenant::where('site_host', 'tenant1.local')->first();

if (!$tenant) {
    echo "❌ Tenant non trouvé\n";
    exit(1);
}

tenancy()->initialize($tenant);

$user = DB::connection('tenant')
    ->table('t_users')
    ->where('username', $username)
    ->where('application', 'admin')
    ->first();

if (!$user) {
    echo "❌ Utilisateur non trouvé\n";
    exit(1);
}

echo "👤 Utilisateur: {$user->username} (ID: {$user->id})\n";
echo "📧 Email: {$user->email}\n";
echo "🔑 Ancien mot de passe (MD5): " . substr($user->password, 0, 20) . "...\n\n";

// Vérifier que c'est bien MD5
if (strlen($user->password) === 32 && md5($password) === $user->password) {
    echo "✅ Mot de passe MD5 vérifié\n";
    echo "🔄 Migration vers bcrypt...\n\n";

    $newHash = Hash::make($password);

    DB::connection('tenant')
        ->table('t_users')
        ->where('id', $user->id)
        ->update(['password' => $newHash]);

    echo "✅ Mot de passe migré avec succès!\n";
    echo "🔑 Nouveau hash (bcrypt): " . substr($newHash, 0, 40) . "...\n\n";

    echo "📍 Vous pouvez maintenant tester avec Postman:\n";
    echo "   Route: POST http://tenant1.local/api/auth/login\n";
    echo "   Body:\n";
    echo "   {\n";
    echo "     \"username\": \"$username\",\n";
    echo "     \"password\": \"$password\",\n";
    echo "     \"application\": \"admin\"\n";
    echo "   }\n";
} else {
    echo "❌ Le mot de passe ne correspond pas ou n'est pas en MD5\n";
    exit(1);
}