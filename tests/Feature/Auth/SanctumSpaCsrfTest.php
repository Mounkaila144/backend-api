<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

/**
 * Feature tests for the Sanctum SPA pipeline that don't require a tenant in the DB.
 *
 * These pin down the contract: the api group must detect stateful frontend requests
 * (Origin/Referer in SANCTUM_STATEFUL_DOMAINS) and run the cookie+session+CSRF stack.
 * If anything in bootstrap/app.php or config/sanctum.php is changed in a way that
 * breaks the SPA bootstrap, these tests fail before users do.
 */
class SanctumSpaCsrfTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the test request is recognised as coming from the SPA frontend.
        // Sanctum's EnsureFrontendRequestsAreStateful checks Origin/Referer host
        // against config('sanctum.stateful'). 'localhost' is on the default list.
        config([
            'sanctum.stateful' => ['localhost', '127.0.0.1', 'tenant1.local'],
        ]);
    }

    public function test_csrf_cookie_endpoint_returns_204_and_sets_xsrf_cookie(): void
    {
        $response = $this->withHeaders([
            'Origin'  => 'http://localhost',
            'Referer' => 'http://localhost/',
        ])->getJson('/api/csrf-cookie');

        $response->assertNoContent();

        // XSRF-TOKEN must be readable by JS (NOT httpOnly) so axios can copy it
        // into X-XSRF-TOKEN on subsequent requests.
        $cookies = $response->headers->getCookies();
        $xsrf    = collect($cookies)->first(fn ($c) => $c->getName() === 'XSRF-TOKEN');
        $this->assertNotNull($xsrf, 'XSRF-TOKEN cookie must be set by /api/csrf-cookie.');
        $this->assertFalse($xsrf->isHttpOnly(), 'XSRF-TOKEN must be JS-readable.');
    }

    public function test_csrf_cookie_endpoint_starts_a_session(): void
    {
        $response = $this->withHeaders([
            'Origin'  => 'http://localhost',
            'Referer' => 'http://localhost/',
        ])->getJson('/api/csrf-cookie');

        $sessionCookieName = config('session.cookie');
        $cookies           = $response->headers->getCookies();
        $session           = collect($cookies)->first(fn ($c) => $c->getName() === $sessionCookieName);

        $this->assertNotNull($session, "Session cookie '{$sessionCookieName}' must be set.");
        $this->assertTrue($session->isHttpOnly(), 'Session cookie MUST be httpOnly — invisible to JS, immune to XSS theft.');
    }

    public function test_non_stateful_origin_does_not_engage_session_pipeline(): void
    {
        // Same endpoint, but Origin is NOT in sanctum.stateful → Sanctum skips the
        // cookie/session middleware. The route still responds (it's just an empty
        // 204) but no XSRF or session cookie is emitted.
        $response = $this->withHeaders([
            'Origin'  => 'http://evil.example.com',
            'Referer' => 'http://evil.example.com/',
        ])->getJson('/api/csrf-cookie');

        $response->assertNoContent();

        $cookies = $response->headers->getCookies();
        $xsrf    = collect($cookies)->first(fn ($c) => $c->getName() === 'XSRF-TOKEN');
        $this->assertNull($xsrf, 'Non-stateful origin must not receive an XSRF token.');
    }
}
