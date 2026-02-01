<?php

namespace Modules\User\Console;

use Illuminate\Console\Command;
use Modules\User\Services\UserSearchService;

class ReindexUsersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:reindex
                            {--tenant= : Tenant ID to reindex (optional)}
                            {--configure : Configure the index settings before reindexing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reindex all users in Meilisearch for the specified tenant';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tenantId = $this->option('tenant');
        $configure = $this->option('configure');

        if (!$tenantId) {
            $this->error('Please specify a tenant ID with --tenant=X');
            return 1;
        }

        $this->info("Reindexing users for tenant {$tenantId}...");

        // Initialize tenant context
        try {
            $tenant = \App\Models\Tenant::find($tenantId);

            if (!$tenant) {
                $this->error("Tenant {$tenantId} not found");
                return 1;
            }

            tenancy()->initialize($tenant);

            $searchService = app(UserSearchService::class);

            if (!$searchService->isAvailable()) {
                $this->error('Meilisearch is not available. Please check your configuration.');
                return 1;
            }

            if ($configure) {
                $this->info('Configuring index...');
                $searchService->configureIndex();
                $this->info('Index configured.');
            }

            $this->info('Starting reindex...');
            $result = $searchService->reindexAll();

            if ($result['success']) {
                $this->info("Successfully reindexed {$result['total_indexed']} users.");
                return 0;
            } else {
                $this->error("Reindex failed: {$result['message']}");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error("Error: {$e->getMessage()}");
            return 1;
        } finally {
            tenancy()->end();
        }
    }
}
