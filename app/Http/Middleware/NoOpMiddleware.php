<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pass-through middleware. Used to swap out Sanctum's AuthenticateSession in the SPA
 * pipeline because that middleware tries to resolve the user (and therefore touch the
 * tenant DB connection) BEFORE InitializeTenancy has run, which throws.
 *
 * The only feature we lose by skipping AuthenticateSession is the auto-logout when an
 * admin password hash changes — acceptable tradeoff given the multi-tenant constraints.
 * The actual user resolution still happens later via auth:sanctum, which fires AFTER
 * InitializeTenancy.
 */
class NoOpMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }
}
