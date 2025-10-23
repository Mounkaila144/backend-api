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
        // Option 1: Identifier par header X-Tenant-ID (recommandé pour API)
        if ($request->hasHeader('X-Tenant-ID')) {
            $tenantId = $request->header('X-Tenant-ID');
            $tenant = Tenant::where('site_id', $tenantId)
                ->where('site_available', 'YES')
                ->first();
        } // Option 2: Identifier par domaine (Host header)
        else {
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

        // Exécuter la requête
        $response = $next($request);

        // Terminer le contexte tenant
        tenancy()->end();

        return $response;
    }
}
