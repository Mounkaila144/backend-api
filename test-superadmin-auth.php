<?php

/**
 * Script de test pour créer un utilisateur SuperAdmin et obtenir un token
 * Usage: php test-superadmin-auth.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\UserSuperadmin;
use Illuminate\Support\Facades\Hash;

echo "=== Test SuperAdmin Auth ===\n\n";

// 1. Créer ou récupérer un utilisateur superadmin
$email = 'superadmin@example.com';
$password = 'password123';

$user = UserSuperadmin::firstOrCreate(
    ['email' => $email],
    [
        'name' => 'Super Admin',
        'password' => Hash::make($password),
        'role' => 'superadmin',
    ]
);

echo "✓ Utilisateur SuperAdmin créé/trouvé:\n";
echo "  Email: {$user->email}\n";
echo "  ID: {$user->id}\n\n";

// 2. Créer un token Sanctum
$token = $user->createToken('test-token')->plainTextToken;

echo "✓ Token Sanctum créé:\n";
echo "  {$token}\n\n";

// 3. Instructions d'utilisation
echo "=== Instructions d'utilisation ===\n\n";
echo "1. Utilisez ce token dans vos requêtes:\n";
echo "   Authorization: Bearer {$token}\n\n";

echo "2. Exemple avec curl:\n";
echo "   curl -X GET \"http://api.local/api/superadmin/modules\" \\\n";
echo "     -H \"Authorization: Bearer {$token}\" \\\n";
echo "     -H \"Accept: application/json\"\n\n";

echo "3. Connexion:\n";
echo "   Email: {$email}\n";
echo "   Password: {$password}\n\n";

echo "✓ Terminé!\n";
