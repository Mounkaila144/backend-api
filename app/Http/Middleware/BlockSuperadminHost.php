<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Inverse of EnforceSuperadminHost: rejects requests that hit a tenant route
 * (admin / frontend) when they arrive on the superadmin host.
 *
 * Why: keeps tenant-scoped APIs invisible from the superadmin domain, so a
 * leaked superadmin session can't pivot into a tenant's data through API
 * exploration on the same host.
 */
class BlockSuperadminHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $superadminHost = (string) config('superadmin.domain', '');

        if ($superadminHost === '') {
            return $next($request);
        }

        if (strcasecmp($request->getHost(), $superadminHost) === 0) {
            return response()->json([
                'success' => false,
                'error'   => 'Not found',
            ], 404);
        }

        return $next($request);
    }
}
