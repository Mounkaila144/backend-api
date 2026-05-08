<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\InitializeTenancy;
use Illuminate\Http\Request;
use Illuminate\Session\Store;
use Illuminate\Session\ArraySessionHandler;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Unit tests for InitializeTenancy::detectTenantBindingMismatch — the security-critical
 * piece that blocks cross-tenant pivots. Each branch of the binding logic is exercised
 * here so a regression on tenant isolation will trip a test, not a customer.
 */
class InitializeTenancyTest extends TestCase
{
    private function invokeBindingCheck(InitializeTenancy $middleware, Request $request, int $tenantId): mixed
    {
        $method = new ReflectionMethod(InitializeTenancy::class, 'detectTenantBindingMismatch');
        $method->setAccessible(true);

        return $method->invoke($middleware, $request, $tenantId);
    }

    private function makeRequestWithSession(?int $sessionTenantId): Request
    {
        $request = Request::create('/api/admin/auth/me', 'GET');
        $session = new Store('test_session', new ArraySessionHandler(60));
        $session->start();
        if ($sessionTenantId !== null) {
            $session->put('tenant_site_id', $sessionTenantId);
        }
        $request->setLaravelSession($session);

        return $request;
    }

    public function test_session_binding_matches_returns_null_no_mismatch(): void
    {
        $request    = $this->makeRequestWithSession(1);
        $middleware = new InitializeTenancy();

        $response = $this->invokeBindingCheck($middleware, $request, 1);

        $this->assertNull($response, 'Matching session tenant should pass through.');
    }

    public function test_session_binding_mismatch_returns_403(): void
    {
        // SECURITY: the cross-tenant pivot we explicitly block.
        // User authenticated against tenant 1, request resolved to tenant 2 via spoofed header.
        $request    = $this->makeRequestWithSession(1);
        $middleware = new InitializeTenancy();

        $response = $this->invokeBindingCheck($middleware, $request, 2);

        $this->assertNotNull($response, 'Mismatched session tenant must be rejected.');
        $this->assertSame(403, $response->getStatusCode());
        $this->assertStringContainsString('Session does not belong', $response->getContent());
    }

    public function test_session_without_tenant_binding_falls_through_to_token_check(): void
    {
        // Session exists but has no tenant_site_id (e.g. anonymous browsing) → no decision yet.
        // Without a bearer either, returns null (auth middleware will reject if route is protected).
        $request    = $this->makeRequestWithSession(null);
        $middleware = new InitializeTenancy();

        $response = $this->invokeBindingCheck($middleware, $request, 1);

        $this->assertNull($response);
    }

    public function test_no_session_no_bearer_returns_null(): void
    {
        $request    = Request::create('/api/admin/auth/me', 'GET');
        $middleware = new InitializeTenancy();

        $response = $this->invokeBindingCheck($middleware, $request, 1);

        $this->assertNull($response, 'Anonymous request must pass through; auth middleware handles 401 later.');
    }

    public function test_bearer_with_unknown_token_returns_null(): void
    {
        // Garbage token → PersonalAccessToken::findToken returns null → no mismatch decision.
        $request = Request::create('/api/admin/auth/me', 'GET');
        $request->headers->set('Authorization', 'Bearer not-a-real-token');
        $middleware = new InitializeTenancy();

        $response = $this->invokeBindingCheck($middleware, $request, 1);

        $this->assertNull($response, 'Invalid token defers to auth:sanctum which will return 401.');
    }
}
