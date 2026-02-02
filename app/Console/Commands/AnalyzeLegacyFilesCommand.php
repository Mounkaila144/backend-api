<?php

namespace App\Console\Commands;

use App\Services\Migration\LegacyPathMapper;
use Illuminate\Console\Command;

class AnalyzeLegacyFilesCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'legacy:analyze
                            {--site= : Analyze specific site}
                            {--all : Analyze all sites}
                            {--export= : Export report to JSON file}
                            {--legacy-path= : Path to legacy Symfony project}';

    /**
     * The console command description.
     */
    protected $description = 'Analyze files in legacy Symfony 1 project for migration planning';

    /**
     * Execute the console command.
     */
    public function handle(LegacyPathMapper $pathMapper): int
    {
        $legacyPath = $this->option('legacy-path');
        if ($legacyPath) {
            $pathMapper->setLegacyBasePath($legacyPath);
        }

        $siteName = $this->option('site');
        $analyzeAll = $this->option('all');
        $exportPath = $this->option('export');

        if ($siteName) {
            $report = $this->analyzeSite($pathMapper, $siteName);
        } elseif ($analyzeAll) {
            $report = $this->analyzeAllSites($pathMapper);
        } else {
            $this->showOverview($pathMapper);
            return 0;
        }

        if ($exportPath) {
            file_put_contents($exportPath, json_encode($report, JSON_PRETTY_PRINT));
            $this->info("Report exported to: {$exportPath}");
        }

        return 0;
    }

    /**
     * Analyse un site spécifique
     */
    protected function analyzeSite(LegacyPathMapper $pathMapper, string $siteName): array
    {
        $this->info("Analyzing site: {$siteName}");
        $this->newLine();

        $report = $pathMapper->generateMigrationReport($siteName);

        // Informations générales
        $this->table(
            ['Property', 'Value'],
            [
                ['Site Name', $report['site_name']],
                ['Tenant ID', $report['tenant_id'] ?? 'Unknown'],
                ['Total Files', $report['summary']['total_files']],
                ['Total Size', $report['summary']['total_size_human']],
                ['Legacy Path', $report['legacy_base_path']],
                ['New Path', $report['new_base_path']],
            ]
        );

        // Par module
        if (!empty($report['by_module'])) {
            $this->newLine();
            $this->info('Files by Module:');

            $rows = [];
            foreach ($report['by_module'] as $module => $count) {
                $rows[] = [$module, $count];
            }
            $this->table(['Module', 'Files'], $rows);
        }

        // Par type
        if (!empty($report['by_type'])) {
            $this->newLine();
            $this->info('Files by Type:');

            $rows = [];
            foreach ($report['by_type'] as $type => $count) {
                $rows[] = [$type, $count];
            }
            $this->table(['Module/Type', 'Files'], $rows);
        }

        // Échantillon de fichiers
        $this->newLine();
        $this->info('Sample files (first 10):');

        $count = 0;
        foreach ($pathMapper->listLegacyFiles($siteName) as $file) {
            $this->line(sprintf(
                '  %s -> %s (%s)',
                $file['filename'],
                $file['new_path'],
                $this->formatBytes($file['size'])
            ));

            $count++;
            if ($count >= 10) {
                break;
            }
        }

        return $report;
    }

    /**
     * Analyse tous les sites
     */
    protected function analyzeAllSites(LegacyPathMapper $pathMapper): array
    {
        $sites = $pathMapper->listLegacySites();
        $globalReport = [
            'analyzed_at' => now()->toIso8601String(),
            'total_sites' => count($sites),
            'sites_with_data' => 0,
            'total_files' => 0,
            'total_size' => 0,
            'sites' => [],
        ];

        $rows = [];

        foreach ($sites as $site) {
            if (!$site['has_data']) {
                $rows[] = [
                    $site['name'],
                    $site['tenant_id'] ?? 'N/A',
                    'No',
                    0,
                    '-',
                ];
                continue;
            }

            $globalReport['sites_with_data']++;
            $stats = $pathMapper->countFilesToMigrate($site['name']);

            $globalReport['total_files'] += $stats['total'];
            $globalReport['total_size'] += $stats['total_size'];

            $globalReport['sites'][$site['name']] = [
                'tenant_id' => $site['tenant_id'],
                'files' => $stats['total'],
                'size' => $stats['total_size'],
                'by_module' => $stats['by_module'],
            ];

            $rows[] = [
                $site['name'],
                $site['tenant_id'] ?? 'N/A',
                'Yes',
                $stats['total'],
                $this->formatBytes($stats['total_size']),
            ];
        }

        $this->info('Legacy Project Analysis');
        $this->newLine();

        $this->table(
            ['Site', 'Tenant ID', 'Has Data', 'Files', 'Size'],
            $rows
        );

        $this->newLine();
        $this->info('Summary:');
        $this->line("  Total sites: {$globalReport['total_sites']}");
        $this->line("  Sites with data: {$globalReport['sites_with_data']}");
        $this->line("  Total files: {$globalReport['total_files']}");
        $this->line("  Total size: " . $this->formatBytes($globalReport['total_size']));

        return $globalReport;
    }

    /**
     * Affiche un aperçu général
     */
    protected function showOverview(LegacyPathMapper $pathMapper): void
    {
        $sites = $pathMapper->listLegacySites();

        $this->info('Legacy Symfony 1 Project Overview');
        $this->newLine();

        if (empty($sites)) {
            $this->warn('No sites found.');
            $this->line('Use --legacy-path to specify the Symfony project location.');
            return;
        }

        $count = count($sites);
        $this->line("Found {$count} sites");
        $this->newLine();
        $withData = count(array_filter($sites, fn($s) => $s['has_data']));

        $this->line("Total sites: {$count}");
        $this->line("Sites with data: {$withData}");

        $this->newLine();
        $this->info('Commands:');
        $this->line('  php artisan legacy:analyze --site=site_theme32');
        $this->line('  php artisan legacy:analyze --all');
        $this->line('  php artisan legacy:analyze --all --export=report.json');
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
