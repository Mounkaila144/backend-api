<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Modules\Superadmin\Exceptions\StorageException;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

class TenantStorageManager implements TenantStorageManagerInterface
{
    use LogsSuperadminActivity;
    protected string $disk = 'local'; // Utiliser 'local' pour dev, 's3' pour production

    /**
     * Structure de dossiers standard par module
     */
    protected array $standardFolders = [
        'uploads',
        'templates',
        'exports',
        'temp',
    ];

    /**
     * Champs sensibles à chiffrer dans les configs
     */
    protected array $sensitiveConfigFields = [
        'api_key',
        'secret',
        'password',
        'token',
    ];

    /**
     * Crée la structure de fichiers pour un module
     */
    public function createModuleStructure(int $tenantId, string $moduleName): void
    {
        $basePath = $this->getModulePath($tenantId, $moduleName);

        try {
            // Créer le dossier racine du module
            Storage::disk($this->disk)->makeDirectory($basePath);

            // Créer les sous-dossiers standards
            foreach ($this->standardFolders as $folder) {
                Storage::disk($this->disk)->makeDirectory("{$basePath}/{$folder}");
            }
        } catch (\Exception $e) {
            throw StorageException::creationFailed($basePath, $e->getMessage());
        }
    }

    /**
     * Vérifie si la structure du module existe
     */
    public function moduleStructureExists(int $tenantId, string $moduleName): bool
    {
        $basePath = $this->getModulePath($tenantId, $moduleName);
        return Storage::disk($this->disk)->exists($basePath);
    }

    /**
     * Retourne le chemin de base pour un module d'un tenant
     */
    public function getModulePath(int $tenantId, string $moduleName): string
    {
        return "tenants/{$tenantId}/modules/{$moduleName}";
    }

    /**
     * Retourne le chemin de base pour un tenant
     */
    public function getTenantPath(int $tenantId): string
    {
        return "tenants/{$tenantId}";
    }

    /**
     * Liste les fichiers d'un module
     */
    public function listModuleFiles(int $tenantId, string $moduleName): array
    {
        $path = $this->getModulePath($tenantId, $moduleName);
        return Storage::disk($this->disk)->allFiles($path);
    }

    /**
     * Retourne la taille totale d'un module en bytes
     */
    public function getModuleSize(int $tenantId, string $moduleName): int
    {
        $files = $this->listModuleFiles($tenantId, $moduleName);
        $totalSize = 0;

        foreach ($files as $file) {
            $totalSize += Storage::disk($this->disk)->size($file);
        }

        return $totalSize;
    }

    /**
     * Génère le fichier de configuration pour un module
     */
    public function generateModuleConfig(int $tenantId, string $moduleName, array $config = []): void
    {
        $configPath = $this->getConfigPath($tenantId, $moduleName);

        // Chiffrer les données sensibles
        $secureConfig = $this->encryptSensitiveData($config);

        try {
            Storage::disk($this->disk)->put(
                $configPath,
                json_encode($secureConfig, JSON_PRETTY_PRINT)
            );
        } catch (\Exception $e) {
            throw StorageException::creationFailed($configPath, $e->getMessage());
        }
    }

    /**
     * Met à jour la configuration d'un module
     */
    public function updateModuleConfig(int $tenantId, string $moduleName, array $config): void
    {
        $this->generateModuleConfig($tenantId, $moduleName, $config);
    }

    /**
     * Lit la configuration d'un module
     */
    public function readModuleConfig(int $tenantId, string $moduleName): ?array
    {
        $configPath = $this->getConfigPath($tenantId, $moduleName);

        if (!Storage::disk($this->disk)->exists($configPath)) {
            return null;
        }

        $content = Storage::disk($this->disk)->get($configPath);
        $config = json_decode($content, true);

        // Déchiffrer les données sensibles
        return $this->decryptSensitiveData($config);
    }

    /**
     * Supprime la configuration d'un module
     */
    public function deleteModuleConfig(int $tenantId, string $moduleName): void
    {
        $configPath = $this->getConfigPath($tenantId, $moduleName);

        if (!Storage::disk($this->disk)->exists($configPath)) {
            $this->logInfo('Module config already deleted or does not exist', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $configPath,
            ]);
            return;
        }

        try {
            Storage::disk($this->disk)->delete($configPath);

            $this->logInfo('Module config deleted', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $configPath,
            ]);
        } catch (\Exception $e) {
            $this->logError('Module config deletion failed', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $configPath,
                'error' => $e->getMessage(),
            ]);
            throw StorageException::deletionFailed($configPath, $e->getMessage());
        }
    }

    /**
     * Retourne le chemin du fichier de config
     */
    protected function getConfigPath(int $tenantId, string $moduleName): string
    {
        return "tenants/{$tenantId}/config/module_{$moduleName}.json";
    }

    /**
     * Chiffre les données sensibles
     */
    protected function encryptSensitiveData(array $config): array
    {
        foreach ($this->sensitiveConfigFields as $field) {
            if (isset($config[$field]) && !empty($config[$field])) {
                $config[$field] = Crypt::encryptString($config[$field]);
            }
        }
        return $config;
    }

    /**
     * Déchiffre les données sensibles
     */
    protected function decryptSensitiveData(array $config): array
    {
        foreach ($this->sensitiveConfigFields as $field) {
            if (isset($config[$field]) && !empty($config[$field])) {
                try {
                    $config[$field] = Crypt::decryptString($config[$field]);
                } catch (\Exception $e) {
                    // Valeur non chiffrée, garder telle quelle
                }
            }
        }
        return $config;
    }

    /**
     * Supprime la structure de fichiers d'un module
     */
    public function deleteModuleStructure(int $tenantId, string $moduleName): void
    {
        $basePath = $this->getModulePath($tenantId, $moduleName);

        if (!Storage::disk($this->disk)->exists($basePath)) {
            $this->logInfo('Module storage already deleted or does not exist', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $basePath,
            ]);
            return; // Rien à supprimer
        }

        try {
            // Supprimer tous les fichiers d'abord
            $files = Storage::disk($this->disk)->allFiles($basePath);
            $filesCount = count($files);

            foreach ($files as $file) {
                Storage::disk($this->disk)->delete($file);
            }

            // Supprimer les dossiers
            Storage::disk($this->disk)->deleteDirectory($basePath);

            $this->logInfo('Module storage deleted', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $basePath,
                'files_deleted' => $filesCount,
            ]);
        } catch (\Exception $e) {
            $this->logError('Module storage deletion failed', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $basePath,
                'error' => $e->getMessage(),
            ]);
            throw StorageException::deletionFailed($basePath, $e->getMessage());
        }
    }

    /**
     * Vérifie si des fichiers existent dans la structure du module
     */
    public function hasModuleFiles(int $tenantId, string $moduleName): bool
    {
        $files = $this->listModuleFiles($tenantId, $moduleName);
        return !empty($files);
    }

    /**
     * Compte les fichiers d'un module
     */
    public function countModuleFiles(int $tenantId, string $moduleName): int
    {
        return count($this->listModuleFiles($tenantId, $moduleName));
    }

    /**
     * Crée un backup des fichiers d'un module
     * Retourne le chemin du backup ou null si aucun fichier à sauvegarder
     */
    public function backupModule(int $tenantId, string $moduleName): ?string
    {
        $sourcePath = $this->getModulePath($tenantId, $moduleName);
        $date = now()->format('Y-m-d_His');
        $backupName = "backup_{$moduleName}_{$date}.zip";
        $backupPath = "tenants/{$tenantId}/backups/{$backupName}";

        // Récupérer tous les fichiers
        $files = Storage::disk($this->disk)->allFiles($sourcePath);

        if (empty($files)) {
            $this->logInfo('No files to backup, skipping', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'source_path' => $sourcePath,
            ]);
            return null;
        }

        try {
            // Créer le ZIP en mémoire
            $zip = new \ZipArchive();
            $tempPath = tempnam(sys_get_temp_dir(), 'backup_');

            if ($zip->open($tempPath, \ZipArchive::CREATE) !== true) {
                throw new \Exception('Failed to create ZIP archive');
            }

            foreach ($files as $file) {
                $content = Storage::disk($this->disk)->get($file);
                $relativePath = str_replace($sourcePath . '/', '', $file);
                $zip->addFromString($relativePath, $content);
            }

            $zip->close();

            // Upload vers S3
            Storage::disk($this->disk)->put($backupPath, file_get_contents($tempPath));

            // Nettoyer le fichier temporaire
            unlink($tempPath);

            $backupSize = Storage::disk($this->disk)->size($backupPath);

            $this->logInfo('Module backup created', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'backup_path' => $backupPath,
                'files_count' => count($files),
                'backup_size' => $backupSize,
            ]);

            return $backupPath;

        } catch (\Exception $e) {
            $this->logError('Module backup failed', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'source_path' => $sourcePath,
                'error' => $e->getMessage(),
            ]);

            // Nettoyer le fichier temporaire si existe
            if (isset($tempPath) && file_exists($tempPath)) {
                unlink($tempPath);
            }

            throw StorageException::backupFailed($sourcePath, $e->getMessage());
        }
    }

    /**
     * Liste les backups d'un tenant
     */
    public function listBackups(int $tenantId, ?string $moduleName = null): array
    {
        $path = "tenants/{$tenantId}/backups/";

        if (!Storage::disk($this->disk)->exists($path)) {
            return [];
        }

        $files = Storage::disk($this->disk)->files($path);

        $backups = [];
        foreach ($files as $file) {
            if ($moduleName && !str_contains($file, "backup_{$moduleName}_")) {
                continue;
            }

            $backups[] = [
                'path' => $file,
                'name' => basename($file),
                'size' => Storage::disk($this->disk)->size($file),
                'created_at' => Storage::disk($this->disk)->lastModified($file),
            ];
        }

        return $backups;
    }

    /**
     * Supprime un backup
     */
    public function deleteBackup(string $backupPath): void
    {
        if (!Storage::disk($this->disk)->exists($backupPath)) {
            $this->logWarning('Backup not found for deletion', [
                'backup_path' => $backupPath,
            ]);
            return;
        }

        try {
            Storage::disk($this->disk)->delete($backupPath);

            $this->logInfo('Backup deleted', [
                'backup_path' => $backupPath,
            ]);
        } catch (\Exception $e) {
            $this->logError('Backup deletion failed', [
                'backup_path' => $backupPath,
                'error' => $e->getMessage(),
            ]);
            throw StorageException::deletionFailed($backupPath, $e->getMessage());
        }
    }
}
