<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use Tests\Concerns\BootsMultiTenantSqlite;
use Tests\TestCase;

/**
 * Smoke test for the BootsMultiTenantSqlite trait — proves the SQLite + TestTenant
 * binding actually persists tenants on a clean DB. If this fails, every other
 * multi-tenant feature test fails too.
 */
class MultiTenantBootstrapTest extends TestCase
{
    use BootsMultiTenantSqlite;

    public function test_trait_creates_t_sites_table(): void
    {
        $this->assertTrue(\Schema::hasTable('t_sites'));
        $this->assertTrue(\Schema::hasTable('t_users'));
        $this->assertTrue(\Schema::hasTable('personal_access_tokens'));
    }

    public function test_create_tenant_writes_real_columns(): void
    {
        $tenant = $this->createTestTenant([
            'site_id'   => 42,
            'site_host' => 'tenant42.example',
        ]);

        $this->assertSame(42, (int) $tenant->site_id);
        $this->assertSame('tenant42.example', $tenant->site_host);

        // Read it back via the live model resolution path the middleware uses.
        $resolved = Tenant::query()->where('site_id', 42)->first();

        $this->assertNotNull($resolved);
        $this->assertSame('tenant42.example', $resolved->site_host);
        $this->assertSame('YES', $resolved->site_available);
    }

    public function test_two_tenants_coexist_with_distinct_site_ids(): void
    {
        $t1 = $this->createTestTenant(['site_id' => 1, 'site_host' => 'a.local']);
        $t2 = $this->createTestTenant(['site_id' => 2, 'site_host' => 'b.local']);

        $this->assertSame(2, Tenant::query()->count());
        $this->assertNotSame($t1->site_id, $t2->site_id);
    }
}
