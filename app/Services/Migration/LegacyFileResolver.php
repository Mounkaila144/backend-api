<?php

namespace App\Services\Migration;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Superadmin\Services\ServiceConfigManager;

/**
 * LegacyFileResolver
 *
 * Service de compatibilité pour résoudre les chemins de fichiers
 * pendant la période de transition Symfony 1 -> Laravel
 *
 * Stratégie de résolution:
 * 1. Chercher d'abord dans S3/nouveau stockage
 * 2. Si non trouvé, chercher dans l'ancien chemin Symfony
 * 3. Optionnellement migrer à la volée vers S3
 *
 * Cela permet une migration progressive sans interruption de service
 */
class LegacyFileResolver
{
    protected ?S3Client $s3Client = null;
    protected ?array $s3Config = null;
    protected bool $s3Available = false;
    protected bool $autoMigrate = false;

    public function __construct(
        protected LegacyPathMapper $pathMapper,
        protected ServiceConfigManager $configManager
    ) {
        $this->initializeS3();
        $this->autoMigrate = config('migration.auto_migrate', false);
    }

    /**
     * Initialise le client S3
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
                $this->s3Available = true;
            }
        } catch (\Exception $e) {
            Log::warning('LegacyFileResolver: S3 initialization failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Résout un chemin de fichier (ancien ou nouveau format)
     * et retourne le contenu du fichier
     *
     * @param string $path Chemin du fichier (format ancien ou nouveau)
     * @param int|null $tenantId ID du tenant (optionnel, pour construire le chemin)
     * @return array|null ['content' => string, 'source' => 'new'|'legacy', 'path' => string]
     */
    public function resolve(string $path, ?int $tenantId = null): ?array
    {
        // Détecter le format du chemin
        $isLegacyPath = $this->isLegacyPath($path);
        $isNewPath = $this->isNewPath($path);

        // Si c'est un nouveau chemin, chercher d'abord dans S3
        if ($isNewPath) {
            $content = $this->getFromNewStorage($path);
            if ($content !== null) {
                return [
                    'content' => $content,
                    'source' => 'new',
                    'path' => $path,
                ];
            }

            // Convertir en ancien chemin et chercher
            $legacyPath = $this->pathMapper->convertToLegacyPath($path);
            if ($legacyPath) {
                $content = $this->getFromLegacyStorage($legacyPath);
                if ($content !== null) {
                    // Auto-migration si activée
                    if ($this->autoMigrate) {
                        $this->migrateOnTheFly($legacyPath, $path, $content);
                    }

                    return [
                        'content' => $content,
                        'source' => 'legacy',
                        'path' => $legacyPath,
                        'new_path' => $path,
                    ];
                }
            }
        }

        // Si c'est un ancien chemin
        if ($isLegacyPath) {
            // D'abord, vérifier si déjà migré vers S3
            $parsed = $this->pathMapper->parseLegacyPath($path);
            if ($parsed) {
                $content = $this->getFromNewStorage($parsed['new_path']);
                if ($content !== null) {
                    return [
                        'content' => $content,
                        'source' => 'new',
                        'path' => $parsed['new_path'],
                        'legacy_path' => $path,
                    ];
                }
            }

            // Chercher dans l'ancien stockage
            $content = $this->getFromLegacyStorage($path);
            if ($content !== null) {
                // Auto-migration si activée
                if ($this->autoMigrate && $parsed) {
                    $this->migrateOnTheFly($path, $parsed['new_path'], $content);
                }

                return [
                    'content' => $content,
                    'source' => 'legacy',
                    'path' => $path,
                    'new_path' => $parsed['new_path'] ?? null,
                ];
            }
        }

        // Essayer comme chemin relatif avec tenant_id
        if ($tenantId !== null && !$isLegacyPath && !$isNewPath) {
            // Construire le nouveau chemin
            $newPath = "tenants/{$tenantId}/{$path}";
            $content = $this->getFromNewStorage($newPath);
            if ($content !== null) {
                return [
                    'content' => $content,
                    'source' => 'new',
                    'path' => $newPath,
                ];
            }

            // Construire l'ancien chemin
            $siteName = "site_theme{$tenantId}";
            $legacyPath = $this->pathMapper->convertToLegacyPath($newPath);
            if ($legacyPath) {
                $content = $this->getFromLegacyStorage($legacyPath);
                if ($content !== null) {
                    return [
                        'content' => $content,
                        'source' => 'legacy',
                        'path' => $legacyPath,
                    ];
                }
            }
        }

        return null;
    }

    /**
     * Résout un fichier et retourne une URL signée
     *
     * @param string $path
     * @param int|null $tenantId
     * @param int $expirationMinutes
     * @return array|null ['url' => string, 'source' => string, 'expires_at' => string]
     */
    public function resolveUrl(string $path, ?int $tenantId = null, int $expirationMinutes = 60): ?array
    {
        $resolved = $this->resolve($path, $tenantId);

        if ($resolved === null) {
            return null;
        }

        // Si le fichier est dans S3, générer une URL signée
        if ($resolved['source'] === 'new' && $this->s3Available) {
            $url = $this->generateSignedUrl($resolved['path'], $expirationMinutes);
            return [
                'url' => $url,
                'source' => 'new',
                'expires_at' => now()->addMinutes($expirationMinutes)->toIso8601String(),
            ];
        }

        // Si le fichier est dans l'ancien stockage, retourner un chemin local
        // ou migrer vers S3 d'abord
        if ($resolved['source'] === 'legacy') {
            if ($this->autoMigrate && isset($resolved['new_path'])) {
                // Migrer et générer l'URL
                $this->migrateOnTheFly($resolved['path'], $resolved['new_path'], $resolved['content']);

                if ($this->s3Available) {
                    $url = $this->generateSignedUrl($resolved['new_path'], $expirationMinutes);
                    return [
                        'url' => $url,
                        'source' => 'migrated',
                        'expires_at' => now()->addMinutes($expirationMinutes)->toIso8601String(),
                    ];
                }
            }

            // Retourner le chemin local
            return [
                'url' => null,
                'local_path' => $resolved['path'],
                'source' => 'legacy',
                'needs_migration' => true,
            ];
        }

        return null;
    }

    /**
     * Vérifie si un fichier existe (ancien ou nouveau stockage)
     *
     * @param string $path
     * @param int|null $tenantId
     * @return bool
     */
    public function exists(string $path, ?int $tenantId = null): bool
    {
        return $this->resolve($path, $tenantId) !== null;
    }

    /**
     * Retourne les métadonnées d'un fichier
     *
     * @param string $path
     * @param int|null $tenantId
     * @return array|null
     */
    public function getMetadata(string $path, ?int $tenantId = null): ?array
    {
        $isLegacyPath = $this->isLegacyPath($path);
        $isNewPath = $this->isNewPath($path);

        // Chercher dans le nouveau stockage
        if ($isNewPath && $this->s3Available) {
            try {
                $result = $this->s3Client->headObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $path,
                ]);

                return [
                    'size' => $result['ContentLength'],
                    'mime_type' => $result['ContentType'],
                    'last_modified' => $result['LastModified']->format('Y-m-d H:i:s'),
                    'source' => 'new',
                    'path' => $path,
                ];
            } catch (\Exception $e) {
                // Fichier non trouvé dans S3
            }
        }

        // Chercher dans l'ancien stockage
        $legacyPath = $isLegacyPath ? $path : null;

        if (!$legacyPath && $isNewPath) {
            $legacyPath = $this->pathMapper->convertToLegacyPath($path);
        }

        if ($legacyPath) {
            $fullPath = $this->getLegacyFullPath($legacyPath);
            if (file_exists($fullPath)) {
                return [
                    'size' => filesize($fullPath),
                    'mime_type' => mime_content_type($fullPath) ?: 'application/octet-stream',
                    'last_modified' => date('Y-m-d H:i:s', filemtime($fullPath)),
                    'source' => 'legacy',
                    'path' => $legacyPath,
                ];
            }
        }

        return null;
    }

    /**
     * Récupère le contenu depuis le nouveau stockage (S3 ou local)
     */
    protected function getFromNewStorage(string $path): ?string
    {
        if ($this->s3Available) {
            try {
                $result = $this->s3Client->getObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $path,
                ]);
                return (string) $result['Body'];
            } catch (\Exception $e) {
                // Fichier non trouvé
            }
        }

        // Fallback vers stockage local
        if (Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->get($path);
        }

        return null;
    }

    /**
     * Récupère le contenu depuis l'ancien stockage Symfony
     */
    protected function getFromLegacyStorage(string $path): ?string
    {
        $fullPath = $this->getLegacyFullPath($path);

        if (file_exists($fullPath) && is_readable($fullPath)) {
            return file_get_contents($fullPath);
        }

        return null;
    }

    /**
     * Construit le chemin complet vers un fichier legacy
     */
    protected function getLegacyFullPath(string $path): string
    {
        $basePath = config('migration.legacy_path', 'C:/xampp/htdocs/project');

        // Si le chemin contient déjà 'sites/', c'est un chemin relatif
        if (strpos($path, 'sites/') === 0) {
            return "{$basePath}/{$path}";
        }

        return $path;
    }

    /**
     * Migre un fichier à la volée vers S3
     */
    protected function migrateOnTheFly(string $legacyPath, string $newPath, string $content): void
    {
        try {
            if ($this->s3Available) {
                $mimeType = mime_content_type($this->getLegacyFullPath($legacyPath)) ?: 'application/octet-stream';

                $this->s3Client->putObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $newPath,
                    'Body' => $content,
                    'ContentType' => $mimeType,
                    'ACL' => 'private',
                    'Metadata' => [
                        'migrated_from' => $legacyPath,
                        'migrated_at' => now()->toIso8601String(),
                        'auto_migrated' => 'true',
                    ],
                ]);

                Log::info('File auto-migrated to S3', [
                    'legacy_path' => $legacyPath,
                    'new_path' => $newPath,
                ]);
            } else {
                Storage::disk('local')->put($newPath, $content);
            }
        } catch (\Exception $e) {
            Log::warning('Auto-migration failed', [
                'legacy_path' => $legacyPath,
                'new_path' => $newPath,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Génère une URL signée pour S3
     */
    protected function generateSignedUrl(string $path, int $expirationMinutes): ?string
    {
        if (!$this->s3Available) {
            return null;
        }

        try {
            $cmd = $this->s3Client->getCommand('GetObject', [
                'Bucket' => $this->s3Config['bucket'],
                'Key' => $path,
            ]);

            $request = $this->s3Client->createPresignedRequest(
                $cmd,
                "+{$expirationMinutes} minutes"
            );

            return (string) $request->getUri();
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Vérifie si un chemin est au format legacy Symfony
     */
    protected function isLegacyPath(string $path): bool
    {
        return strpos($path, 'sites/') !== false && strpos($path, '/admin/data/') !== false;
    }

    /**
     * Vérifie si un chemin est au nouveau format Laravel
     */
    protected function isNewPath(string $path): bool
    {
        return strpos($path, 'tenants/') === 0;
    }

    /**
     * Active/désactive la migration automatique
     */
    public function setAutoMigrate(bool $enabled): void
    {
        $this->autoMigrate = $enabled;
    }

    /**
     * Vérifie si S3 est disponible
     */
    public function isS3Available(): bool
    {
        return $this->s3Available;
    }
}
