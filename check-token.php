<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Laravel\Sanctum\PersonalAccessToken;

// Token à vérifier
$token = '4|n6zX1GC1t2UEAbNynT4S2OrigwACl29ig7JIsQ9w43f437b2';

// Extraire l'ID et le token
list($id, $plainTextToken) = explode('|', $token, 2);

echo "Token ID: $id\n";
echo "Plain Text Token: $plainTextToken\n\n";

// Chercher le token dans la base de données
$accessToken = PersonalAccessToken::find($id);

if (!$accessToken) {
    echo "❌ Token introuvable dans la base de données.\n";
    exit(1);
}

echo "✅ Token trouvé!\n";
echo "User ID: " . $accessToken->tokenable_id . "\n";
echo "Token Name: " . $accessToken->name . "\n";
echo "Abilities: " . json_encode($accessToken->abilities) . "\n";
echo "Created: " . $accessToken->created_at . "\n";
echo "Last Used: " . ($accessToken->last_used_at ?? 'Never') . "\n";

// Vérifier que le hash correspond
if (hash_equals($accessToken->token, hash('sha256', $plainTextToken))) {
    echo "✅ Hash du token valide!\n";
} else {
    echo "❌ Hash du token invalide!\n";
}

// Récupérer l'utilisateur
$user = $accessToken->tokenable;
if ($user) {
    echo "\nUtilisateur:\n";
    echo "  ID: " . $user->id . "\n";
    echo "  Username: " . $user->username . "\n";
    echo "  Email: " . $user->email . "\n";
    echo "  Application: " . $user->application . "\n";
} else {
    echo "\n❌ Utilisateur introuvable!\n";
}
