<?php

namespace Tests\Concerns;

use App\Models\Tenant;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\TestTenant;

/**
 * Multi-tenant test bootstrap on a single SQLite file shared across connection names.
 *
 * Why a file (not :memory:): SQLite's :memory: database is private per PDO connection,
 * so the 'mysql', 'tenant', 'central' connection names would each get their own
 * physical schema. We share one file so writes via any connection name land in the
 * same place.
 *
 * Why this trait + TestTenant: stancl/tenancy's BaseTenant serializes attributes into
 * a JSON `data` column by default — but our t_sites schema has real columns. A
 * TestTenant subclass declares every column in getCustomColumns() and is bound to
 * App\Models\Tenant in the container so test code creates/reads tenants through it.
 *
 * Usage:
 *   class MyTest extends TestCase {
 *       use BootsMultiTenantSqlite;
 *   }
 */
trait BootsMultiTenantSqlite
{
    private string $sharedTestDbPath = '';

    /**
     * Sets up the shared SQLite + TestTenant binding. If the consuming test class
     * overrides setUp(), it MUST call parent::setUp() FIRST so this runs.
     * Test-specific seeding (createTestTenant calls) should then go in the override
     * AFTER parent::setUp(), or in each test method directly.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->sharedTestDbPath = sys_get_temp_dir()
            . DIRECTORY_SEPARATOR
            . 'icall26_test_' . getmypid() . '_' . uniqid() . '.sqlite';
        if (file_exists($this->sharedTestDbPath)) {
            unlink($this->sharedTestDbPath);
        }
        touch($this->sharedTestDbPath);

        $sharedConfig = [
            'driver'                  => 'sqlite',
            'database'                => $this->sharedTestDbPath,
            'prefix'                  => '',
            'foreign_key_constraints' => false,
        ];

        // Production names ('mysql', 'tenant', 'central') and the test default ('sqlite')
        // all point to the same physical SQLite file — so any model declaring
        // protected $connection = 'mysql' / 'tenant' / 'central' lands on our schema.
        config([
            'database.default'             => 'sqlite',
            'database.connections.sqlite'  => $sharedConfig,
            'database.connections.mysql'   => $sharedConfig,
            'database.connections.tenant'  => $sharedConfig,
            'database.connections.central' => $sharedConfig,
        ]);

        // Force re-resolution of any cached PDO so the new config takes effect.
        DB::purge('sqlite');
        DB::purge('mysql');
        DB::purge('tenant');
        DB::purge('central');

        // Bind the test tenant subclass so App\Models\Tenant::create()/find() resolves
        // through the override that knows about real t_sites columns.
        $this->app->bind(Tenant::class, TestTenant::class);

        $this->createCentralSchema();
        $this->createTenantUsersTable();
    }

    protected function tearDown(): void
    {
        // Force-disconnect before removing the file (Windows holds the handle otherwise).
        DB::disconnect('sqlite');
        DB::disconnect('mysql');
        DB::disconnect('tenant');
        DB::disconnect('central');

        if ($this->sharedTestDbPath && file_exists($this->sharedTestDbPath)) {
            @unlink($this->sharedTestDbPath);
        }

        parent::tearDown();
    }

    /**
     * Build the central tables (t_sites + Sanctum's personal_access_tokens).
     * Mirrors only the columns referenced by the auth flow — not the full Symfony schema.
     */
    protected function createCentralSchema(): void
    {
        if (!Schema::hasTable('t_sites')) {
            Schema::create('t_sites', function (Blueprint $table) {
                $table->integer('site_id')->primary();
                $table->string('site_host', 255);
                $table->string('site_name', 255)->nullable();
                $table->string('site_db_name', 100);
                $table->string('site_db_host', 100)->default('localhost');
                $table->string('site_db_login', 100);
                $table->string('site_db_password', 255);
                $table->string('site_available', 8)->default('YES');
            });
        }

        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * t_users tenant — owned by the legacy Symfony app, no Laravel migration exists.
     * Recreate the minimum columns for auth tests.
     */
    protected function createTenantUsersTable(): void
    {
        if (Schema::hasTable('t_users')) {
            return;
        }

        Schema::create('t_users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100);
            $table->string('password', 255);
            $table->string('email', 255)->nullable();
            $table->string('firstname', 100)->nullable();
            $table->string('lastname', 100)->nullable();
            $table->string('application', 32)->default('admin');
            $table->string('status', 16)->default('ACTIVE');
            $table->timestamp('lastlogin')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Insert a Tenant in t_sites via raw query builder.
     *
     * Why raw insert: stancl/tenancy's BaseTenant uses VirtualColumn, which writes through
     * a JSON `data` column. The TestTenant override of getCustomColumns() works for queries
     * with `static::`, but Eloquent's lifecycle (events, observers, dispatchesEvents) still
     * routes some operations through the parent class, and the SQLite path is sensitive
     * enough that bypassing all of that and writing the row directly is the most reliable
     * approach for a test seed. Reads still use App\Models\Tenant::find/query() through the
     * normal middleware path — the data is hydrated from real columns since they exist on
     * the table, and getCustomColumns() prevents VirtualColumn from looking for `data`.
     */
    protected function createTestTenant(array $overrides = []): Tenant
    {
        $defaults = [
            'site_host'        => 'tenant1.local',
            'site_name'        => 'Tenant 1',
            'site_db_name'     => 'site_test',
            'site_db_host'     => 'localhost',
            'site_db_login'    => 'root',
            'site_db_password' => '',
            'site_available'   => 'YES',
        ];

        $row = array_merge($defaults, $overrides);
        if (! isset($row['site_id'])) {
            $row['site_id'] = ((int) DB::table('t_sites')->max('site_id')) + 1;
        }

        DB::table('t_sites')->insert($row);

        return Tenant::query()->where('site_id', $row['site_id'])->firstOrFail();
    }

    /**
     * Insert a tenant user.
     */
    protected function createTestTenantUser(array $overrides = []): \Modules\UsersGuard\Entities\User
    {
        $defaults = [
            'username'    => 'admin',
            'password'    => bcrypt('password'),
            'email'       => 'admin@test.local',
            'firstname'   => 'Test',
            'lastname'    => 'Admin',
            'application' => 'admin',
            'status'      => 'ACTIVE',
        ];

        $user = new \Modules\UsersGuard\Entities\User();
        $user->forceFill(array_merge($defaults, $overrides))->save();

        return $user->fresh();
    }
}
