<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Populates config('cors.allowed_origins') at request time from t_sites.
 *
 * Each tenant's frontend lives at the same hostname as its backend (Next.js rewrites
 * /api/* to Laravel), so the allowed origin is derived directly from t_sites.site_host.
 * Both http:// and https:// schemes are emitted to support local dev and prod side by side.
 *
 * Result is cached for 5 minutes. After creating/updating/disabling a tenant, call
 *   Cache::forget(PopulateCorsOrigins::CACHE_KEY)
 * to flush.
 *
 * MUST run BEFORE \Illuminate\Http\Middleware\HandleCors (registered globally first).
 * Laravel's HandleCors re-reads config('cors') on every request, so updating the array
 * here is enough — no need to touch the CorsService instance.
 */
class PopulateCorsOrigins
{
    public const CACHE_KEY = 'cors:tenant_origins';
    public const CACHE_TTL_SECONDS = 300;

    public function handle(Request $request, Closure $next): Response
    {
        $tenantOrigins = Cache::remember(
            self::CACHE_KEY,
            self::CACHE_TTL_SECONDS,
            fn () => $this->loadTenantOrigins()
        );

        $existing = (array) config('cors.allowed_origins', []);
        $merged   = array_values(array_unique(array_merge($existing, $tenantOrigins)));

        config(['cors.allowed_origins' => $merged]);

        return $next($request);
    }

    /**
     * Load enabled tenants from the central DB and emit one origin per scheme.
     */
    private function loadTenantOrigins(): array
    {
        try {
            $hosts = Tenant::query()
                ->where('site_available', 'YES')
                ->pluck('site_host')
                ->filter()
                ->all();
        } catch (\Throwable $e) {
            // Central DB unreachable (boot, migration, etc.) — fall back to static config.
            return [];
        }

        $origins = [];
        foreach ($hosts as $host) {
            $host = trim((string) $host);
            if ($host === '') {
                continue;
            }
            $origins[] = "https://{$host}";
            $origins[] = "http://{$host}";
        }

        return $origins;
    }
}
