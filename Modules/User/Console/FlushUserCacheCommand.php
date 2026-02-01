<?php

namespace Modules\User\Console;

use Illuminate\Console\Command;
use Modules\User\Services\UserCacheService;

class FlushUserCacheCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:flush-cache
                            {--tenant= : Tenant ID to flush cache for (optional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Flush user cache for the specified tenant';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tenantId = $this->option('tenant');

        if (!$tenantId) {
            $this->error('Please specify a tenant ID with --tenant=X');
            return 1;
        }

        $this->info("Flushing user cache for tenant {$tenantId}...");

        try {
            $tenant = \App\Models\Tenant::find($tenantId);

            if (!$tenant) {
                $this->error("Tenant {$tenantId} not found");
                return 1;
            }

            tenancy()->initialize($tenant);

            $cacheService = app(UserCacheService::class);

            if (!$cacheService->isRedisAvailable()) {
                $this->warn('Redis is not available. Using default cache store.');
            }

            $cacheService->flushTenantCache();

            $this->info('User cache flushed successfully.');
            $this->info('Cache store: ' . $cacheService->getCurrentStore());

            return 0;

        } catch (\Exception $e) {
            $this->error("Error: {$e->getMessage()}");
            return 1;
        } finally {
            tenancy()->end();
        }
    }
}
