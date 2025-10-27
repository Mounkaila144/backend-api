<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use Illuminate\Http\Request;

// Configuration
$domain = 'tenant1.local';
$token = '9|kPSor68pxYjPL6HQ0Iavfn5IW818F4IwsPjMx3cKdf8b2a14';

echo "🧪 Test de l'API avec le domaine: $domain\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Créer une requête simulée
$request = Request::create(
    'http://' . $domain . '/api/admin/users',
    'GET',
    [], // parameters
    [], // cookies
    [], // files
    [ // server variables
        'HTTP_HOST' => $domain,
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
    ]
);

echo "📤 Requête:\n";
echo "  URL: " . $request->fullUrl() . "\n";
echo "  Méthode: " . $request->method() . "\n";
echo "  Host: " . $request->header('Host') . "\n";
echo "  Authorization: Bearer " . substr($token, 0, 20) . "...\n\n";

try {
    // Traiter la requête
    echo "⚙️  Traitement de la requête...\n\n";
    $response = $kernel->handle($request);

    echo "📥 Réponse:\n";
    echo "  Status: " . $response->getStatusCode() . "\n";
    echo "  Content-Type: " . $response->headers->get('Content-Type') . "\n\n";

    // Afficher le contenu
    $content = $response->getContent();
    $json = json_decode($content, true);

    if ($response->getStatusCode() === 200) {
        echo "✅ Succès!\n\n";

        if (isset($json['success']) && $json['success']) {
            echo "📊 Données:\n";
            echo "  Nombre d'utilisateurs: " . count($json['data'] ?? []) . "\n";
            echo "  Page actuelle: " . ($json['meta']['current_page'] ?? 'N/A') . "\n";
            echo "  Total: " . ($json['meta']['total'] ?? 'N/A') . "\n";
            echo "  Par page: " . ($json['meta']['per_page'] ?? 'N/A') . "\n\n";

            if (isset($json['tenant'])) {
                echo "🏢 Tenant:\n";
                echo "  ID: " . ($json['tenant']['id'] ?? 'N/A') . "\n";
                echo "  Host: " . ($json['tenant']['host'] ?? 'N/A') . "\n\n";
            }

            if (isset($json['statistics'])) {
                echo "📈 Statistiques:\n";
                echo "  Total: " . ($json['statistics']['total'] ?? 'N/A') . "\n";
                echo "  Actifs: " . ($json['statistics']['active'] ?? 'N/A') . "\n";
                echo "  Inactifs: " . ($json['statistics']['inactive'] ?? 'N/A') . "\n";
                echo "  Verrouillés: " . ($json['statistics']['locked'] ?? 'N/A') . "\n\n";
            }

            // Afficher quelques utilisateurs
            if (!empty($json['data'])) {
                echo "👥 Premiers utilisateurs:\n";
                foreach (array_slice($json['data'], 0, 3) as $user) {
                    echo "  - ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}\n";
                }
            }
        } else {
            echo "⚠️  Réponse inattendue:\n";
            echo json_encode($json, JSON_PRETTY_PRINT) . "\n";
        }
    } else {
        echo "❌ Erreur!\n\n";
        echo "Contenu de la réponse:\n";
        if ($json) {
            echo json_encode($json, JSON_PRETTY_PRINT) . "\n";
        } else {
            echo $content . "\n";
        }
    }

    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    $kernel->terminate($request, $response);

} catch (\Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo "\n" . $e->getTraceAsString() . "\n";
}
