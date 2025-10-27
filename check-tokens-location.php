<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔍 Vérification de l'emplacement des tokens...\n\n";

// Vérifier dans la base centrale
try {
    $centralTokens = DB::connection('mysql')->table('personal_access_tokens')->count();
    echo "📊 Base CENTRALE (mysql):\n";
    echo "  Nombre de tokens: $centralTokens\n\n";

    if ($centralTokens > 0) {
        $tokens = DB::connection('mysql')->table('personal_access_tokens')
            ->select('id', 'tokenable_id', 'tokenable_type', 'name', 'created_at')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        echo "  Derniers tokens:\n";
        foreach ($tokens as $token) {
            echo "    - ID: {$token->id}, User ID: {$token->tokenable_id}, Name: {$token->name}\n";
        }
        echo "\n";
    }
} catch (\Exception $e) {
    echo "❌ Erreur base centrale: " . $e->getMessage() . "\n\n";
}

// Vérifier dans la base tenant
$tenant = \App\Models\Tenant::find(75);
if ($tenant) {
    tenancy()->initialize($tenant);

    echo "📊 Base TENANT (tenant1.local - site_theme32):\n";

    try {
        $tenantTokens = DB::connection('tenant')->table('personal_access_tokens')->count();
        echo "  Nombre de tokens: $tenantTokens\n\n";

        if ($tenantTokens > 0) {
            $tokens = DB::connection('tenant')->table('personal_access_tokens')
                ->select('id', 'tokenable_id', 'tokenable_type', 'name', 'created_at')
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            echo "  Derniers tokens:\n";
            foreach ($tokens as $token) {
                echo "    - ID: {$token->id}, User ID: {$token->tokenable_id}, Name: {$token->name}\n";
            }
            echo "\n";
        }
    } catch (\Exception $e) {
        echo "  ❌ Erreur: " . $e->getMessage() . "\n\n";
    }

    tenancy()->end();
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "CONCLUSION:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
echo "Les tokens sont stockés dans la base TENANT.\n";
echo "Lors de l'authentification via Sanctum, il faut que:\n";
echo "1. Le middleware 'tenant' initialise le contexte AVANT 'auth:sanctum'\n";
echo "2. Ou utiliser un guard personnalisé qui cherche dans la bonne base\n\n";
