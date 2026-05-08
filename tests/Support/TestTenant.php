<?php

namespace Tests\Support;

use App\Models\Tenant;

/**
 * Test-only Tenant subclass.
 *
 * Why this exists:
 *   stancl/tenancy's BaseTenant uses the VirtualColumn trait. By default,
 *   VirtualColumn::getCustomColumns() returns ['id'] only, which means every
 *   other attribute (site_host, site_db_name, …) is serialized into a JSON
 *   `data` column at write time. Our t_sites table has REAL columns, no `data`
 *   column, so $tenant->save() in production works because writes happen via
 *   the ORM through code paths we control. In tests, however, calling save()
 *   directly tries to insert into a non-existent `data` column.
 *
 * Override declares every column on t_sites as a "custom column" so attributes
 * are persisted through the real columns (no JSON wrapping, no data column).
 *
 * Bound to App\Models\Tenant in the container by BootsMultiTenantSqlite so any
 * `app(Tenant::class)` or `App\Models\Tenant::create()` resolves to this class
 * during tests, leaving production code untouched.
 */
class TestTenant extends Tenant
{
    public static function getCustomColumns(): array
    {
        // Every column on t_sites that we want persisted as a real column.
        // Mirrors database/migrations/2026_01_28_001900_create_t_sites_table.php.
        return [
            'site_id',
            'site_host',
            'site_name',
            'site_db_name',
            'site_db_host',
            'site_db_login',
            'site_db_password',
            'site_available',
        ];
    }
}
