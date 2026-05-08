<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\NoOpMiddleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * NoOpMiddleware swaps Sanctum's AuthenticateSession in the SPA pipeline so the user is
 * not eagerly resolved before InitializeTenancy can register the tenant DB connection.
 * This test pins down the contract: it MUST pass the request through untouched.
 */
class NoOpMiddlewareTest extends TestCase
{
    public function test_request_passes_through_unchanged(): void
    {
        $request    = Request::create('/anything', 'GET');
        $expected   = new JsonResponse(['ok' => true]);
        $middleware = new NoOpMiddleware();

        $actual = $middleware->handle($request, fn ($r) => $r === $request ? $expected : new JsonResponse(['ok' => false]));

        $this->assertSame($expected, $actual, 'NoOpMiddleware must hand the response from $next back unchanged.');
    }
}
