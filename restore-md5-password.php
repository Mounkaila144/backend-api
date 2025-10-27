<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

echo "🔄 Restauration du mot de passe MD5\n";
echo "===================================\n\n";

$username = 'superadmin';
$password = '123';
$md5Password = md5($password);

$tenant = Tenant::where('site_host', 'tenant1.local')->first();

if (!$tenant) {
    echo "❌ Tenant non trouvé\n";
    exit(1);
}

tenancy()->initialize($tenant);

echo "👤 Utilisateur: $username\n";
echo "🔑 Mot de passe: $password\n";
echo "🔑 Hash MD5: $md5Password\n\n";

DB::connection('tenant')
    ->table('t_users')
    ->where('username', $username)
    ->update(['password' => $md5Password]);

echo "✅ Mot de passe MD5 restauré!\n\n";

echo "💡 Le système a été modifié pour supporter MD5.\n";
echo "   Vous pouvez maintenant vous connecter avec:\n";
echo "   POST http://tenant1.local/api/auth/login\n";
echo "   Body: {\"username\":\"$username\",\"password\":\"$password\",\"application\":\"admin\"}\n";
