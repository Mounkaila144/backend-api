<?php


namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
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
        // Si une session SPA est établie (admin guard) elle a stocké le site_id du tenant
        // sur lequel l'utilisateur s'est authentifié (cf. AuthController::login). On rejette
        // toute requête où le tenant résolu ci-dessus diffère.
        //
        // Bearer tokens (legacy / mobile): l'ability `tenant:<site_id>` est vérifiée à la place.
        // Les tokens superadmin (`role:superadmin`) traversent les tenants → bypass.
        if ($mismatch = $this->detectTenantBindingMismatch($request, (int) $tenant->site_id)) {
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
     * Returns a 403 JsonResponse if the authenticated principal does not belong to $tenantId.
     * Returns null if there's no authentication context or if the binding matches.
     */
    private function detectTenantBindingMismatch(Request $request, int $tenantId): ?Response
    {
        // 1) Session-based binding (Sanctum SPA — primary path).
        //    AuthController::login stores tenant_site_id at login time.
        if ($request->hasSession() && $request->session()->has('tenant_site_id')) {
            $sessionTenantId = (int) $request->session()->get('tenant_site_id');

            if ($sessionTenantId === $tenantId) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error'   => 'Session does not belong to this tenant',
                'hint'    => 'Please re-authenticate against the correct tenant',
            ], 403);
        }

        // 2) Bearer token binding (legacy / non-SPA clients).
        //    Token must carry ability tenant:<site_id> (set by AuthController on PAT issuance).
        $bearer = $request->bearerToken();
        if (!$bearer) {
            // Pas d'auth du tout — auth:sanctum / auth:admin refusera plus tard pour les routes protégées.
            return null;
        }

        try {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($bearer);
        } catch (\Throwable $e) {
            return null;
        }

        if ($accessToken === null) {
            return null;
        }

        $abilities = (array) ($accessToken->abilities ?? []);

        // Superadmin tokens are allowed to traverse tenants.
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
