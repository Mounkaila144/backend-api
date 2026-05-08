<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

/**
 * End-to-end coverage for the cross-tenant pivot block — DEFERRED until a proper
 * multi-tenant test bootstrap is in place.
 *
 * Why this test is skipped today:
 *   The production code stack (stancl/tenancy + 3 named MySQL connections + a Tenant
 *   model that proxies attributes through a `data` JSON column) doesn't lift cleanly
 *   onto SQLite-in-memory tests. A bootstrap attempt in this branch hit two issues:
 *     1. Eloquent's BaseTenant writes to a `data` column that t_sites doesn't have
 *        (stancl/tenancy's getCustomColumns() returns ['id'] only).
 *     2. `Schema::create('t_sites')` and `DB::table('t_sites')->insert()` resolved to
 *        different physical SQLite files even when the connection config was identical,
 *        so migrations and reads landed in separate schemas.
 *
 * What's already covered without this test:
 *   - tests/Unit/Http/Middleware/InitializeTenancyTest covers the binding logic
 *     (session match/mismatch, no-auth fallback, invalid token) at the middleware
 *     unit level — the security-critical branch is exercised.
 *   - The browser-driven test we ran during the SPA migration confirmed the binding
 *     fires end-to-end against the real MySQL multi-tenant stack.
 *
 * Next steps to enable this test:
 *   - Override App\Models\Tenant::getCustomColumns() to declare real columns, OR
 *   - Build a TestTenant subclass and bind it in the container during tests.
 *   - Use a Laravel "central" connection plus stancl's bootstrappers in the test
 *     setUp, or replace the bootstrappers with no-ops via a TenancyTestingTrait.
 */
class CrossTenantPivotTest extends TestCase
{
    public function test_session_bound_to_tenant_1_cannot_pivot_to_tenant_2(): void
    {
        $this->markTestSkipped(
            'Cross-tenant pivot is covered by InitializeTenancyTest at the unit level. '
            . 'Wiring stancl/tenancy + multi-MySQL into the SQLite test bootstrap is deferred '
            . '(see class docblock for the resolution path).'
        );
    }
}
