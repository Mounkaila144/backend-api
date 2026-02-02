<?php

namespace App\Services\Migration;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Superadmin\Services\ServiceConfigManager;

/**
 * FileMigrationService
 *
 * Service de migration des fichiers de l'ancien projet Symfony 1 vers S3/MinIO
 *
 * Fonctionnalités:
 * - Migration par site/tenant
 * - Migration par module
 * - Migration incrémentale (ne migre pas les fichiers déjà migrés)
 * - Rapport de migration détaillé
 * - Support dry-run pour prévisualisation
 * - Mise à jour des chemins en base de données
 */
class FileMigrationService
{
    protected ?S3Client $s3Client = null;
    protected ?array $s3Config = null;
    protected string $disk = 'local';
    protected array $migrationLog = [];
    protected array $errors = [];

    public function __construct(
        protected LegacyPathMapper $pathMapper,
        protected ServiceConfigManager $configManager
    ) {
        $this->initializeS3();
    }

    /**
     * Initialise le client S3 si la config existe
     */
    protected function initializeS3(): void
    {
        try {
            $this->s3Config = $this->configManager->get('s3');

            if ($this->s3Config && !empty($this->s3Config['access_key'])) {
                $this->s3Client = new S3Client([
                    'version' => 'latest',
                    'region' => $this->s3Config['region'] ?? 'us-east-1',
                    'credentials' => [
                        'key' => $this->s3Config['access_key'],
                        'secret' => $this->s3Config['secret_key'],
                    ],
                    'endpoint' => $this->s3Config['endpoint'] ?? null,
                    'use_path_style_endpoint' => $this->s3Config['use_path_style'] ?? false,
                ]);
                $this->disk = 's3';
            }
        } catch (\Exception $e) {
            Log::warning('S3 initialization failed for migration', [
                'error' => $e->getMessage(),
            ]);
            $this->s3Client = null;
            $this->disk = 'local';
        }
    }

    /**
     * Migre tous les fichiers d'un site vers S3
     *
     * @param string $siteName Nom du site Symfony (ex: 'site_theme32')
     * @param array $options [
     *   'dry_run' => bool,        // Prévisualisation sans migration réelle
     *   'modules' => array|null,  // Liste des modules à migrer (null = tous)
     *   'update_db' => bool,      // Mettre à jour les chemins en base
     *   'overwrite' => bool,      // Écraser les fichiers existants
     *   'batch_size' => int,      // Nombre de fichiers par batch
     *   'callback' => callable,   // Callback de progression
     * ]
     * @return array Rapport de migration
     */
    public function migrateSite(string $siteName, array $options = []): array
    {
        $options = array_merge([
            'dry_run' => false,
            'modules' => null,
            'update_db' => true,
            'overwrite' => false,
            'batch_size' => 100,
            'callback' => null,
        ], $options);

        $this->migrationLog = [];
        $this->errors = [];

        $tenantId = $this->pathMapper->extractTenantId($siteName);
        if ($tenantId === null) {
            return [
                'success' => false,
                'error' => "Cannot extract tenant ID from site name: {$siteName}",
            ];
        }

        $report = [
            'site_name' => $siteName,
            'tenant_id' => $tenantId,
            'started_at' => now()->toIso8601String(),
            'dry_run' => $options['dry_run'],
            'destination' => $this->disk,
            'migrated' => 0,
            'skipped' => 0,
            'failed' => 0,
            'total_size' => 0,
            'by_module' => [],
            'errors' => [],
        ];

        $batch = [];
        $batchCount = 0;

        foreach ($this->pathMapper->listLegacyFiles($siteName) as $file) {
            // Filtrer par module si spécifié
            if ($options['modules'] !== null && !in_array($file['module'], $options['modules'])) {
                continue;
            }

            $batch[] = $file;

            if (count($batch) >= $options['batch_size']) {
                $batchResult = $this->processBatch($batch, $options);
                $this->mergeBatchResult($report, $batchResult);
                $batch = [];
                $batchCount++;

                // Callback de progression
                if ($options['callback'] && is_callable($options['callback'])) {
                    call_user_func($options['callback'], [
                        'batch' => $batchCount,
                        'processed' => $report['migrated'] + $report['skipped'] + $report['failed'],
                    ]);
                }
            }
        }

        // Traiter le dernier batch
        if (!empty($batch)) {
            $batchResult = $this->processBatch($batch, $options);
            $this->mergeBatchResult($report, $batchResult);
        }

        $report['completed_at'] = now()->toIso8601String();
        $report['duration_seconds'] = now()->diffInSeconds($report['started_at']);
        $report['errors'] = $this->errors;
        $report['success'] = empty($this->errors);

        // Log le rapport
        Log::channel('migration')->info('Site migration completed', $report);

        return $report;
    }

    /**
     * Traite un batch de fichiers
     */
    protected function processBatch(array $files, array $options): array
    {
        $result = [
            'migrated' => 0,
            'skipped' => 0,
            'failed' => 0,
            'total_size' => 0,
            'by_module' => [],
        ];

        foreach ($files as $file) {
            try {
                $migrated = $this->migrateFile($file, $options);

                if ($migrated === true) {
                    $result['migrated']++;
                    $result['total_size'] += $file['size'];

                    if (!isset($result['by_module'][$file['module']])) {
                        $result['by_module'][$file['module']] = ['migrated' => 0, 'skipped' => 0, 'failed' => 0];
                    }
                    $result['by_module'][$file['module']]['migrated']++;
                } elseif ($migrated === false) {
                    $result['skipped']++;

                    if (!isset($result['by_module'][$file['module']])) {
                        $result['by_module'][$file['module']] = ['migrated' => 0, 'skipped' => 0, 'failed' => 0];
                    }
                    $result['by_module'][$file['module']]['skipped']++;
                }
            } catch (\Exception $e) {
                $result['failed']++;
                $this->errors[] = [
                    'file' => $file['legacy_path'],
                    'error' => $e->getMessage(),
                ];

                if (!isset($result['by_module'][$file['module']])) {
                    $result['by_module'][$file['module']] = ['migrated' => 0, 'skipped' => 0, 'failed' => 0];
                }
                $result['by_module'][$file['module']]['failed']++;
            }
        }

        return $result;
    }

    /**
     * Migre un fichier individuel
     *
     * @param array $file Données du fichier (depuis LegacyPathMapper)
     * @param array $options Options de migration
     * @return bool|null true=migré, false=skipped, null=erreur
     */
    protected function migrateFile(array $file, array $options): ?bool
    {
        $sourcePath = $file['full_path'];
        $destPath = $file['new_path'];

        // Vérifier si le fichier existe déjà
        if (!$options['overwrite'] && $this->fileExists($destPath)) {
            $this->migrationLog[] = [
                'action' => 'skipped',
                'source' => $sourcePath,
                'destination' => $destPath,
                'reason' => 'already_exists',
            ];
            return false;
        }

        // Mode dry-run
        if ($options['dry_run']) {
            $this->migrationLog[] = [
                'action' => 'would_migrate',
                'source' => $sourcePath,
                'destination' => $destPath,
                'size' => $file['size'],
            ];
            return true;
        }

        // Lire le contenu du fichier source
        $content = file_get_contents($sourcePath);
        if ($content === false) {
            throw new \Exception("Cannot read source file: {$sourcePath}");
        }

        // Uploader vers la destination
        $this->uploadFile($destPath, $content, $this->getMimeType($sourcePath));

        // Mettre à jour la base de données si demandé
        if ($options['update_db']) {
            $this->updateDatabasePaths($file);
        }

        $this->migrationLog[] = [
            'action' => 'migrated',
            'source' => $sourcePath,
            'destination' => $destPath,
            'size' => $file['size'],
        ];

        return true;
    }

    /**
     * Upload un fichier vers S3 ou le stockage local
     */
    protected function uploadFile(string $path, string $content, string $mimeType): void
    {
        if ($this->s3Client && $this->s3Config) {
            $this->s3Client->putObject([
                'Bucket' => $this->s3Config['bucket'],
                'Key' => $path,
                'Body' => $content,
                'ContentType' => $mimeType,
                'ACL' => 'private',
            ]);
        } else {
            Storage::disk('local')->put($path, $content);
        }
    }

    /**
     * Vérifie si un fichier existe déjà
     */
    protected function fileExists(string $path): bool
    {
        if ($this->s3Client && $this->s3Config) {
            try {
                $this->s3Client->headObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $path,
                ]);
                return true;
            } catch (\Exception $e) {
                return false;
            }
        }

        return Storage::disk('local')->exists($path);
    }

    /**
     * Détermine le type MIME d'un fichier
     */
    protected function getMimeType(string $path): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        $mimeTypes = [
            'pdf' => 'application/pdf',
            'xml' => 'application/xml',
            'csv' => 'text/csv',
            'json' => 'application/json',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'zip' => 'application/zip',
            'txt' => 'text/plain',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }

    /**
     * Fusionne les résultats d'un batch dans le rapport global
     */
    protected function mergeBatchResult(array &$report, array $batchResult): void
    {
        $report['migrated'] += $batchResult['migrated'];
        $report['skipped'] += $batchResult['skipped'];
        $report['failed'] += $batchResult['failed'];
        $report['total_size'] += $batchResult['total_size'];

        foreach ($batchResult['by_module'] as $module => $stats) {
            if (!isset($report['by_module'][$module])) {
                $report['by_module'][$module] = ['migrated' => 0, 'skipped' => 0, 'failed' => 0];
            }
            $report['by_module'][$module]['migrated'] += $stats['migrated'];
            $report['by_module'][$module]['skipped'] += $stats['skipped'];
            $report['by_module'][$module]['failed'] += $stats['failed'];
        }
    }

    /**
     * Met à jour les chemins de fichiers en base de données
     * Cette méthode doit être personnalisée selon vos tables
     */
    protected function updateDatabasePaths(array $file): void
    {
        // Mapping des modules vers les tables et colonnes
        $mappings = [
            'customers' => [
                'table' => 't_customers_documents',
                'column' => 'file_path',
                'id_column' => 'customer_id',
            ],
            'users' => [
                'table' => 't_users',
                'column' => 'picture',
                'id_column' => 'id',
            ],
            'contracts' => [
                'table' => 't_customers_contracts_documents',
                'column' => 'file_path',
                'id_column' => 'contract_id',
            ],
        ];

        $module = $file['module'];

        if (!isset($mappings[$module])) {
            return;
        }

        $mapping = $mappings[$module];

        // Créer une entrée dans la table de migration pour le tracking
        try {
            DB::table('file_migrations')->insert([
                'tenant_id' => $file['tenant_id'],
                'module' => $module,
                'entity_id' => $file['entity_id'],
                'old_path' => $file['legacy_path'],
                'new_path' => $file['new_path'],
                'migrated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Table peut ne pas exister, ignorer
        }
    }

    /**
     * Migre un module spécifique pour un site
     */
    public function migrateModule(string $siteName, string $module, array $options = []): array
    {
        $options['modules'] = [$module];
        return $this->migrateSite($siteName, $options);
    }

    /**
     * Migre tous les sites disponibles
     */
    public function migrateAllSites(array $options = []): array
    {
        $sites = $this->pathMapper->listLegacySites();
        $globalReport = [
            'total_sites' => count($sites),
            'processed' => 0,
            'failed_sites' => [],
            'sites' => [],
        ];

        foreach ($sites as $site) {
            if (!$site['has_data']) {
                continue;
            }

            try {
                $report = $this->migrateSite($site['name'], $options);
                $globalReport['sites'][$site['name']] = $report;
                $globalReport['processed']++;
            } catch (\Exception $e) {
                $globalReport['failed_sites'][] = [
                    'site' => $site['name'],
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $globalReport;
    }

    /**
     * Génère un rapport de prévisualisation sans migrer
     */
    public function preview(string $siteName, array $options = []): array
    {
        $options['dry_run'] = true;
        return $this->migrateSite($siteName, $options);
    }

    /**
     * Retourne le log de migration
     */
    public function getMigrationLog(): array
    {
        return $this->migrationLog;
    }

    /**
     * Retourne les erreurs de migration
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Vérifie si S3 est disponible
     */
    public function isS3Available(): bool
    {
        return $this->s3Client !== null;
    }

    /**
     * Retourne le disque de destination
     */
    public function getDestinationDisk(): string
    {
        return $this->disk;
    }
}
