<?php

namespace Tests\Feature\Auth;

use Tests\Concerns\BootsMultiTenantSqlite;
use Tests\TestCase;

/**
 * End-to-end test for the cross-tenant pivot block — the most important security
 * guarantee of the multi-tenant stack.
 *
 * Seeds two tenants (per-test, since each test gets a fresh SQLite from the trait),
 * simulates an admin session bound to tenant 1, then exercises the auth/me route
 * with the X-Tenant-ID of tenant 2. InitializeTenancy::detectTenantBindingMismatch
 * must intercept it with 403.
 *
 * NOTE: we do NOT override setUp() here. PHP traits can't piggyback on parent::setUp()
 * — overriding setUp() in a test class would shadow the trait's setUp(). Instead each
 * test calls seedTwoTenants() explicitly. The trait's setUp() runs because we don't
 * shadow it.
 */
class CrossTenantPivotTest extends TestCase
{
    use BootsMultiTenantSqlite;

    private function seedTwoTenants(): void
    {
        $this->createTestTenant(['site_id' => 1, 'site_host' => 'tenant1.local']);
        $this->createTestTenant(['site_id' => 2, 'site_host' => 'tenant2.local']);

        // Sanctum's stateful detection looks at Origin/Referer host. Add localhost so
        // the SPA pipeline (session + CSRF) engages and a session is available for
        // the binding check.
        config([
            'sanctum.stateful' => ['localhost', '127.0.0.1', 'tenant1.local', 'tenant2.local'],
        ]);
    }

    public function test_session_bound_to_tenant_1_does_not_trigger_403_on_matching_tenant(): void
    {
        $this->seedTwoTenants();

        // Matching session ↔ X-Tenant-ID: the binding check must NOT fire.
        // We expect 401 (no auth user) — but never 403 (which would mean the
        // binding check fired against a matching tenant — a false positive).
        $response = $this->withSession(['tenant_site_id' => 1])
            ->withHeaders([
                'Origin'      => 'http://localhost',
                'Referer'     => 'http://localhost/',
                'X-Tenant-ID' => '1',
            ])
            ->getJson('/api/admin/auth/me');

        $this->assertNotSame(
            403,
            $response->status(),
            '403 means the cross-tenant check fired on a matching tenant — that is a regression.'
        );
    }

    public function test_session_bound_to_tenant_1_cannot_pivot_to_tenant_2(): void
    {
        $this->seedTwoTenants();

        // SECURITY: this is the cross-tenant pivot we explicitly block.
        // User authenticated against tenant 1 forges X-Tenant-ID: 2 to read tenant 2's data.
        $response = $this->withSession(['tenant_site_id' => 1])
            ->withHeaders([
                'Origin'      => 'http://localhost',
                'Referer'     => 'http://localhost/',
                'X-Tenant-ID' => '2',
            ])
            ->getJson('/api/admin/auth/me');

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'error'   => 'Session does not belong to this tenant',
        ]);
    }

    public function test_request_to_unknown_tenant_returns_404(): void
    {
        $this->seedTwoTenants();

        // X-Tenant-ID: 9999 doesn't match any t_sites row → tenant resolution fails.
        // Must return 404 (not 403): leaking "tenant 9999 exists but you can't access"
        // would be an info disclosure.
        $response = $this->withSession(['tenant_site_id' => 1])
            ->withHeaders([
                'Origin'      => 'http://localhost',
                'X-Tenant-ID' => '9999',
            ])
            ->getJson('/api/admin/auth/me');

        $response->assertStatus(404);
    }

    public function test_anonymous_request_with_valid_tenant_falls_through_to_auth(): void
    {
        $this->seedTwoTenants();

        // No session, no bearer token — the binding check returns null, then auth:sanctum
        // refuses with 401. The tenant binding must not pre-empt auth in the anonymous case.
        $response = $this->withHeaders([
            'Origin'      => 'http://localhost',
            'X-Tenant-ID' => '1',
        ])->getJson('/api/admin/auth/me');

        $response->assertStatus(401);
    }
}
