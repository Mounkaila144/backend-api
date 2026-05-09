<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts superadmin routes to a dedicated hostname.
 *
 * Why: when /api/superadmin/* is reachable from any tenant host (tenant1.local,
 * tenant2.local, …), the superadmin login form is discoverable from inside any
 * tenant. Concentrating the superadmin surface on its own host (superadmin.local
 * in dev, admin.<tld> in prod) means a tenant user can't even probe it.
 *
 * Pairs with EnforceTenantHost which does the inverse: blocks tenant routes from
 * being served on the superadmin host.
 */
class EnforceSuperadminHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('superadmin.domain', '');

        if ($expected === '') {
            // No host configured — fail open (caller can still hit the route).
            // We log so misconfiguration is visible.
            \Log::warning('superadmin.domain is empty — EnforceSuperadminHost is a no-op.');

            return $next($request);
        }

        if (strcasecmp($request->getHost(), $expected) !== 0) {
            return response()->json([
                'success' => false,
                'error'   => 'Not found',
            ], 404);
        }

        return $next($request);
    }
}
