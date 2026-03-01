<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Modules\UsersGuard\Entities\User;

echo "=== GÉNÉRATION TOKEN SANCTUM ===" . PHP_EOL . PHP_EOL;

$userData = DB::connection('mysql')->table('t_users')
    ->where('username', 'superadmin')
    ->where('application', 'superadmin')
    ->first();

if (!$userData) {
    echo "❌ Utilisateur superadmin non trouvé!" . PHP_EOL;
    exit(1);
}

$user = new User();
$user->id = $userData->id;
$user->username = $userData->username;
$user->email = $userData->email;
$user->exists = true;

$token = $user->createToken('test-token')->plainTextToken;

echo "✅ Token généré:" . PHP_EOL;
echo $token . PHP_EOL . PHP_EOL;

echo "EXEMPLES:" . PHP_EOL;
echo "curl -X POST \"http://api.local/api/superadmin/modules/resolve-dependencies\" \\" . PHP_EOL;
echo "  -H \"Authorization: Bearer {$token}\" \\" . PHP_EOL;
echo "  -H \"Content-Type: application/json\" \\" . PHP_EOL;
echo "  -d '{\"modules\": [\"User\", \"Customer\"]}'" . PHP_EOL;
