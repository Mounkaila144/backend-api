<?php


namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancy
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Option 1: Identifier par header X-Tenant-ID
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
                'hint' => 'Please provide X-Tenant-ID header or valid domain',
            ], 404);
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
}
