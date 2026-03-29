<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Migrates tenant files from tenants/{site_db_name}/ to sites/{site_db_name}/
 * to match the Symfony file structure for direct migration compatibility.
 *
 * Usage: php artisan storage:migrate-tenant-paths
 *        php artisan storage:migrate-tenant-paths --dry-run
 */
class MigrateTenantStoragePaths extends Command
{
    protected $signature = 'storage:migrate-tenant-paths {--dry-run : Show what would be moved without actually moving}';
    protected $description = 'Move tenant files from tenants/ to sites/ prefix to match Symfony structure';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
        $disk = $storageManager->getCurrentDisk();

        $this->info("Using disk: {$disk}");
        $this->info($dryRun ? '=== DRY RUN ===' : '=== MIGRATING ===');

        // Find all tenant directories under tenants/
        $tenantDirs = Storage::disk($disk)->directories('tenants');

        if (empty($tenantDirs)) {
            $this->info('No directories found under tenants/. Nothing to migrate.');
            return 0;
        }

        $totalFiles = 0;
        $movedFiles = 0;

        foreach ($tenantDirs as $tenantDir) {
            // tenants/site_theme32 → sites/site_theme32
            $folderName = basename($tenantDir);
            $oldBase = "tenants/{$folderName}";
            $newBase = "sites/{$folderName}";

            $this->info("Processing: {$oldBase} → {$newBase}");

            // Get all files recursively
            $files = Storage::disk($disk)->allFiles($oldBase);
            $totalFiles += count($files);

            foreach ($files as $oldPath) {
                $relativePath = substr($oldPath, strlen($oldBase) + 1);
                $newPath = "{$newBase}/{$relativePath}";

                if ($dryRun) {
                    $this->line("  Would move: {$oldPath} → {$newPath}");
                } else {
                    try {
                        // Copy then delete (move doesn't work across S3 prefixes reliably)
                        $content = Storage::disk($disk)->get($oldPath);
                        Storage::disk($disk)->put($newPath, $content);
                        Storage::disk($disk)->delete($oldPath);
                        $movedFiles++;
                        $this->line("  Moved: {$relativePath}");
                    } catch (\Exception $e) {
                        $this->error("  Failed: {$oldPath} - {$e->getMessage()}");
                    }
                }
            }

            // Clean up empty old directory
            if (!$dryRun && $movedFiles > 0) {
                try {
                    Storage::disk($disk)->deleteDirectory($oldBase);
                    $this->info("  Removed old directory: {$oldBase}");
                } catch (\Exception $e) {
                    // S3 doesn't have real directories, this is OK
                }
            }
        }

        $this->newLine();
        $this->info($dryRun
            ? "Would move {$totalFiles} files."
            : "Moved {$movedFiles}/{$totalFiles} files."
        );

        return 0;
    }
}
