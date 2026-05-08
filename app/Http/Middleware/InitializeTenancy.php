<?php


namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancy
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Option 1: Identifier par header X-Tenant-ID
        $tenant = null;
        if ($request->hasHeader('X-Tenant-ID')) {
            $tenantId = $request->header('X-Tenant-ID');

            $tenant = is_numeric($tenantId)
                ? Tenant::where('site_id', $tenantId)->where('site_available', 'YES')->first()
                : Tenant::where('site_host', $tenantId)->where('site_available', 'YES')->first();
        }

        // Option 2 (ou fallback): Identifier par domaine (Host header)
        if (empty($tenant)) {
            $domain = $request->getHost();
            $tenant = Tenant::where('site_host', $domain)
                ->where('site_available', 'YES')
                ->first();
        }

        // Vérifier si le tenant existe
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'error' => 'Tenant not found or unavailable',
                'hint'  => 'Please provide X-Tenant-ID header or valid domain',
            ], 404);
        }

        // SÉCURITÉ — empêche le pivot cross-tenant.
        //
        // Si la requête porte un Bearer Sanctum, le token DOIT correspondre au tenant
        // résolu ci-dessus, sinon n'importe quel utilisateur authentifié pourrait
        // changer le header X-Tenant-ID et opérer sur les données d'un autre site.
        //
        // Conventions d'abilities (posées au login dans AuthController) :
        //   - role:superadmin       → bypass tenant (peut traverser plusieurs sites)
        //   - tenant:<site_id>      → token lié strictement à ce site
        //   - autre / aucun         → token legacy, refusé (forcer re-login)
        if ($mismatch = $this->detectTokenTenantMismatch($request, (int) $tenant->site_id)) {
            return $mismatch;
        }

        // Initialiser le contexte tenant
        tenancy()->initialize($tenant);

        // try/finally garantit que tenancy()->end() est appelé même si
        // $next() lève une exception. Sans ça, le worker PHP-FPM resterait
        // dans un état tenant pour la requête suivante (qui pourrait alors
        // tenter de lire des données central avec une mauvaise connexion).
        try {
            $response = $next($request);
        } finally {
            tenancy()->end();
        }

        return $response;
    }

    /**
     * Returns a 403 JsonResponse if the bearer token does not belong to $tenantId.
     * Returns null if the binding is OK or no bearer token is present.
     */
    private function detectTokenTenantMismatch(Request $request, int $tenantId): ?Response
    {
        $bearer = $request->bearerToken();
        if (!$bearer) {
            // Pas de token — l'éventuel auth:sanctum refusera plus tard pour les routes protégées.
            return null;
        }

        try {
            $accessToken = PersonalAccessToken::findToken($bearer);
        } catch (\Throwable $e) {
            // Lookup échoué (DB indisponible) — laisse auth:sanctum gérer.
            return null;
        }

        if ($accessToken === null) {
            // Token invalide → auth:sanctum renverra 401 plus loin.
            return null;
        }

        $abilities = (array) ($accessToken->abilities ?? []);

        // Superadmin : autorisé à traverser les tenants.
        if (in_array('role:superadmin', $abilities, true)) {
            return null;
        }

        $tokenTenantId = null;
        foreach ($abilities as $ability) {
            if (is_string($ability) && str_starts_with($ability, 'tenant:')) {
                $tokenTenantId = (int) substr($ability, 7);
                break;
            }
        }

        if ($tokenTenantId === $tenantId) {
            return null;
        }

        return response()->json([
            'success' => false,
            'error'   => 'Token does not belong to this tenant',
            'hint'    => 'Please re-authenticate against the correct tenant',
        ], 403);
    }
}
