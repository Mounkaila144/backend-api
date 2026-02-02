<?php

namespace App\Console\Commands;

use App\Services\Migration\FileMigrationService;
use App\Services\Migration\LegacyPathMapper;
use Illuminate\Console\Command;

class MigrateFilesCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'migrate:files
                            {--site= : Site name to migrate (e.g., site_theme32)}
                            {--all : Migrate all sites}
                            {--module= : Only migrate specific module}
                            {--dry-run : Preview without actual migration}
                            {--no-db : Skip database path updates}
                            {--overwrite : Overwrite existing files}
                            {--legacy-path= : Path to legacy Symfony project}';

    /**
     * The console command description.
     */
    protected $description = 'Migrate files from Symfony 1 project to S3/new storage';

    /**
     * Execute the console command.
     */
    public function handle(LegacyPathMapper $pathMapper, FileMigrationService $migrationService): int
    {
        $siteName = $this->option('site');
        $migrateAll = $this->option('all');
        $module = $this->option('module');
        $dryRun = $this->option('dry-run');
        $skipDb = $this->option('no-db');
        $overwrite = $this->option('overwrite');
        $legacyPath = $this->option('legacy-path');

        if ($legacyPath) {
            $pathMapper->setLegacyBasePath($legacyPath);
        }

        // Vérifier la destination
        $this->info('Migration destination: ' . ($migrationService->isS3Available() ? 'S3/MinIO' : 'Local storage'));

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No files will be migrated');
        }

        // Migrer tous les sites
        if ($migrateAll) {
            return $this->migrateAllSites($pathMapper, $migrationService, [
                'dry_run' => $dryRun,
                'modules' => $module ? [$module] : null,
                'update_db' => !$skipDb,
                'overwrite' => $overwrite,
            ]);
        }

        // Migrer un site spécifique
        if ($siteName) {
            return $this->migrateSite($siteName, $pathMapper, $migrationService, [
                'dry_run' => $dryRun,
                'modules' => $module ? [$module] : null,
                'update_db' => !$skipDb,
                'overwrite' => $overwrite,
            ]);
        }

        // Afficher les sites disponibles
        $this->showAvailableSites($pathMapper);
        return 0;
    }

    /**
     * Migre un site spécifique
     */
    protected function migrateSite(
        string $siteName,
        LegacyPathMapper $pathMapper,
        FileMigrationService $migrationService,
        array $options
    ): int {
        $this->info("Analyzing site: {$siteName}");

        // Afficher le rapport de prévisualisation
        $preview = $pathMapper->generateMigrationReport($siteName);

        if ($preview['summary']['total_files'] === 0) {
            $this->warn("No files found for site: {$siteName}");
            return 0;
        }

        $this->table(
            ['Metric', 'Value'],
            [
                ['Tenant ID', $preview['tenant_id']],
                ['Total Files', $preview['summary']['total_files']],
                ['Total Size', $preview['summary']['total_size_human']],
            ]
        );

        $this->info('Files by module:');
        foreach ($preview['by_module'] as $module => $count) {
            $this->line("  - {$module}: {$count} files");
        }

        if (!$options['dry_run']) {
            if (!$this->confirm('Proceed with migration?')) {
                $this->info('Migration cancelled.');
                return 0;
            }
        }

        // Exécuter la migration
        $this->info('Starting migration...');

        $progressBar = $this->output->createProgressBar($preview['summary']['total_files']);
        $progressBar->start();

        $options['callback'] = function ($progress) use ($progressBar) {
            $progressBar->setProgress($progress['processed']);
        };

        $report = $migrationService->migrateSite($siteName, $options);

        $progressBar->finish();
        $this->newLine(2);

        // Afficher le rapport
        $this->displayReport($report);

        return $report['success'] ? 0 : 1;
    }

    /**
     * Migre tous les sites
     */
    protected function migrateAllSites(
        LegacyPathMapper $pathMapper,
        FileMigrationService $migrationService,
        array $options
    ): int {
        $sites = $pathMapper->listLegacySites();

        $this->info('Found ' . count($sites) . ' sites');

        $sitesWithData = array_filter($sites, fn($s) => $s['has_data']);
        $this->info(count($sitesWithData) . ' sites have data to migrate');

        if (empty($sitesWithData)) {
            $this->warn('No sites with data found.');
            return 0;
        }

        if (!$options['dry_run']) {
            if (!$this->confirm('Migrate all sites?')) {
                $this->info('Migration cancelled.');
                return 0;
            }
        }

        $globalSuccess = true;

        foreach ($sitesWithData as $site) {
            $this->newLine();
            $this->info("=== Migrating {$site['name']} ===");

            $report = $migrationService->migrateSite($site['name'], $options);
            $this->displayReport($report, true);

            if (!$report['success']) {
                $globalSuccess = false;
            }
        }

        return $globalSuccess ? 0 : 1;
    }

    /**
     * Affiche les sites disponibles
     */
    protected function showAvailableSites(LegacyPathMapper $pathMapper): void
    {
        $sites = $pathMapper->listLegacySites();

        if (empty($sites)) {
            $this->warn('No sites found in legacy project.');
            $this->info('Check the legacy path with --legacy-path option');
            return;
        }

        $this->info('Available sites:');
        $this->newLine();

        $rows = [];
        foreach ($sites as $site) {
            $stats = $site['has_data'] ? $pathMapper->countFilesToMigrate($site['name']) : null;
            $rows[] = [
                $site['name'],
                $site['tenant_id'] ?? 'N/A',
                $site['has_data'] ? 'Yes' : 'No',
                $stats ? $stats['total'] : 0,
                $stats ? $this->formatBytes($stats['total_size']) : '-',
            ];
        }

        $this->table(
            ['Site Name', 'Tenant ID', 'Has Data', 'Files', 'Size'],
            $rows
        );

        $this->newLine();
        $this->info('Usage examples:');
        $this->line('  php artisan migrate:files --site=site_theme32');
        $this->line('  php artisan migrate:files --site=site_theme32 --dry-run');
        $this->line('  php artisan migrate:files --site=site_theme32 --module=customers');
        $this->line('  php artisan migrate:files --all');
    }

    /**
     * Affiche un rapport de migration
     */
    protected function displayReport(array $report, bool $compact = false): void
    {
        if ($compact) {
            $this->line(sprintf(
                '  Migrated: %d | Skipped: %d | Failed: %d | Size: %s',
                $report['migrated'],
                $report['skipped'],
                $report['failed'],
                $this->formatBytes($report['total_size'])
            ));
        } else {
            $this->info('Migration Report:');
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Files Migrated', $report['migrated']],
                    ['Files Skipped', $report['skipped']],
                    ['Files Failed', $report['failed']],
                    ['Total Size', $this->formatBytes($report['total_size'])],
                    ['Duration', ($report['duration_seconds'] ?? 0) . ' seconds'],
                    ['Destination', $report['destination']],
                ]
            );

            if (!empty($report['by_module'])) {
                $this->info('By Module:');
                foreach ($report['by_module'] as $module => $stats) {
                    $this->line(sprintf(
                        '  %s: migrated=%d, skipped=%d, failed=%d',
                        $module,
                        $stats['migrated'],
                        $stats['skipped'],
                        $stats['failed']
                    ));
                }
            }

            if (!empty($report['errors'])) {
                $this->error('Errors:');
                foreach (array_slice($report['errors'], 0, 10) as $error) {
                    $this->line("  - {$error['file']}: {$error['error']}");
                }
                if (count($report['errors']) > 10) {
                    $this->line('  ... and ' . (count($report['errors']) - 10) . ' more errors');
                }
            }
        }
    }

    /**
     * Formate les bytes
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        return round($bytes / pow(1024, $pow), 2) . ' ' . $units[$pow];
    }
}
