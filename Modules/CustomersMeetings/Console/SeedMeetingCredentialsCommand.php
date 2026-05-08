<?php

namespace Modules\CustomersMeetings\Console;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Story M5.1 — ensure the meeting-side credentials referenced by Stories M0
 * to M4 exist in `t_permissions` for every tenant, and link them to the
 * admin-application superadmin group.
 *
 * Idempotent. Skip-safe to re-run after each deploy.
 */
class SeedMeetingCredentialsCommand extends Command
{
    protected $signature = 'meetings:seed-credentials
                            {--tenant= : Tenant site_id (omit to seed all available tenants)}
                            {--no-link : Only insert missing permission rows; do not link them to any group}';

    protected $description = 'Ensure the meeting-side ISO3 / quotation / transform-to-contract credentials exist in every tenant.';

    /**
     * The credentials Stories M0–M4 expect. Each row is created with
     * application='admin' when missing.
     *
     * @var string[]
     */
    private const CREDENTIALS = [
        // Document section gates per polluter type (already seeded historically
        // in legacy tenants, but re-asserted for parity with fresh tenants).
        'app_domoprime_iso3_meeting_view_ite_documents',
        'app_domoprime_iso3_meeting_view_boiler_documents',
        'app_domoprime_iso3_meeting_view_pack_documents',
        'app_domoprime_iso3_meeting_view_type1_documents',
        'app_domoprime_iso3_meeting_view_type2_documents',
        // Pre-meeting PDF (Story M1)
        'app_domoprime_meeting_view_premeeting_document',
        // Quotations CRUD (Stories M0/M2)
        'app_domoprime_iso3_meeting_list_quotation_new',
        'app_domoprime_iso_meeting_view_quotations',
        'app_domoprime_meeting_list_quotation_edit',
        'app_domoprime_meeting_list_quotation_delete',
        // Meeting → contract transformation (Story M4)
        'customer_meeting_transform_to_contract',
    ];

    public function handle(): int
    {
        $tenantId = $this->option('tenant');
        $tenants = $tenantId
            ? Tenant::query()->where('site_id', $tenantId)->get()
            : Tenant::query()->available()->get();

        if ($tenants->isEmpty()) {
            $this->error($tenantId ? "Tenant {$tenantId} not found." : 'No available tenant found.');
            return self::FAILURE;
        }

        $exit = self::SUCCESS;

        foreach ($tenants as $tenant) {
            $siteDb = (string) $tenant->site_db_name;
            if ($siteDb === '') {
                $this->warn("Tenant {$tenant->site_id}: missing site_db_name, skipping.");
                continue;
            }

            try {
                tenancy()->initialize($tenant);
                [$inserted, $linked] = $this->seedForTenant();
                $this->info(sprintf(
                    'Tenant %s: %d permission(s) inserted, %d link(s) created on superadmin.',
                    $siteDb,
                    $inserted,
                    $linked
                ));
            } catch (Throwable $e) {
                $this->error("Tenant {$siteDb}: {$e->getMessage()}");
                $exit = self::FAILURE;
            } finally {
                tenancy()->end();
            }
        }

        return $exit;
    }

    /**
     * @return array{0:int,1:int}  [inserted_count, linked_count]
     */
    private function seedForTenant(): array
    {
        $db = DB::connection('tenant');

        // Resolve the admin-app superadmin group once. If absent we still
        // create the permission rows but cannot link them — that's the case
        // the user reported in tenants without a superadmin admin group.
        $superadminId = (int) ($db->table('t_groups')
            ->where('name', 'superadmin')
            ->where('application', 'admin')
            ->value('id') ?? 0);

        $existing = $db->table('t_permissions')
            ->whereIn('name', self::CREDENTIALS)
            ->pluck('id', 'name');

        $inserted = 0;
        foreach (self::CREDENTIALS as $name) {
            if ($existing->has($name)) {
                continue;
            }

            $newId = $db->table('t_permissions')->insertGetId([
                'name' => $name,
                'group_id' => 0,
                'application' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $existing[$name] = $newId;
            $inserted++;
        }

        $linked = 0;
        if ($superadminId > 0 && ! $this->option('no-link')) {
            $alreadyLinked = $db->table('t_group_permission')
                ->where('group_id', $superadminId)
                ->whereIn('permission_id', $existing->values())
                ->pluck('permission_id')
                ->all();

            $alreadyLinkedSet = array_flip(array_map('intval', $alreadyLinked));

            foreach ($existing as $permName => $permId) {
                $permId = (int) $permId;
                if (isset($alreadyLinkedSet[$permId])) {
                    continue;
                }

                $db->table('t_group_permission')->insert([
                    'permission_id' => $permId,
                    'group_id' => $superadminId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $linked++;
            }
        }

        return [$inserted, $linked];
    }
}
