<?php

namespace Modules\Superadmin\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Exceptions\StorageException;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

class TenantStorageManager implements TenantStorageManagerInterface
{
    use LogsSuperadminActivity;

    protected string $disk = 'local';
    protected bool $s3Available = false;
    protected ?array $s3Config = null;

    /**
     * Cache des noms de dossiers par tenant ID
     * @var array<int, string>
     */
    protected array $tenantFolderCache = [];

    /**
     * Structure de base pour chaque tenant (conforme à l'architecture Symfony 1)
     * Cette structure est créée une seule fois lors de l'initialisation du tenant
     */
    protected array $baseTenantStructure = [
        // Admin - Back-office
        'admin/data/settings',
        'admin/view/data',

        // Frontend - Front-office
        'frontend/data/settings',
        'frontend/data/models/documents',
        'frontend/view/data/site/company',

        // Superadmin
        'superadmin/data/settings',

        // Install - Migrations SQL par module
        'install',

        // Config - Configurations des modules
        'config',

        // Backups
        'backups',
    ];

    /**
     * Structure de dossiers spécifique par module (conforme à Symfony 1)
     * Chaque module peut définir ses propres dossiers dans admin/data et frontend/data
     */
    protected array $moduleStructures = [
        'User' => [
            'admin/data/users/documents',
            'admin/data/users/avatars',
            'admin/data/users/imports',
        ],
        'Customer' => [
            'admin/data/customers/documents',
            'admin/data/customers/verif',
            'admin/data/customers/imports',
            'frontend/data/customers',
        ],
        'Contract' => [
            'admin/data/contracts/exports/format/imports',
            'frontend/data/contracts',
            'frontend/view/data/contracts/company',
        ],
        'Meeting' => [
            'admin/data/meetings/imports',
            'frontend/data/meetings',
        ],
        'Product' => [
            'admin/view/data/products/installers/files',
            'frontend/data/products',
        ],
        'Partner' => [
            'frontend/view/data/partners',
        ],
        'Polluter' => [
            'frontend/view/data/polluters/company',
        ],
        'Recipient' => [
            'frontend/view/data/recipients/company',
        ],
        'Domoprime' => [
            'frontend/data/domoprime/assets',
            'frontend/data/domoprime/quotations',
        ],
        'Yousign' => [
            'admin/data/services/yousign',
        ],
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

    public function __construct(
        protected ServiceConfigManager $configManager
    ) {
        $this->initializeS3();
    }

    /**
     * Résout le nom du dossier du tenant à partir de son ID
     * Utilise site_db_name au lieu de l'ID numérique (ex: "site_theme32")
     */
    protected function resolveTenantFolder(int $tenantId): string
    {
        // Vérifier le cache
        if (isset($this->tenantFolderCache[$tenantId])) {
            return $this->tenantFolderCache[$tenantId];
        }

        // Récupérer le tenant depuis la base centrale
        $tenant = Tenant::on('mysql')->find($tenantId);

        if (!$tenant || empty($tenant->site_db_name)) {
            // Fallback sur l'ID si pas de site_db_name
            Log::warning('TenantStorageManager: site_db_name not found, using ID', [
                'tenant_id' => $tenantId,
            ]);
            $folderName = "tenant_{$tenantId}";
        } else {
            $folderName = $tenant->site_db_name;
        }

        // Mettre en cache
        $this->tenantFolderCache[$tenantId] = $folderName;

        return $folderName;
    }

    /**
     * Définit manuellement le nom du dossier pour un tenant (utile pour les tests)
     */
    public function setTenantFolder(int $tenantId, string $folderName): void
    {
        $this->tenantFolderCache[$tenantId] = $folderName;
    }

    /**
     * Initialise la connexion S3 si la configuration existe
     */
    protected function initializeS3(): void
    {
        // Vérifier si le driver S3 Flysystem est disponible
        if (!class_exists(\League\Flysystem\AwsS3V3\AwsS3V3Adapter::class)) {
            Log::debug('TenantStorageManager: Flysystem S3 adapter not installed, using local storage. Install with: composer require league/flysystem-aws-s3-v3');
            return;
        }

        try {
            $this->s3Config = $this->configManager->get('s3');

            if ($this->s3Config && !empty($this->s3Config['access_key'])) {
                // Configurer dynamiquement le disque S3
                Config::set('filesystems.disks.tenant_s3', [
                    'driver' => 's3',
                    'key' => $this->s3Config['access_key'],
                    'secret' => $this->s3Config['secret_key'],
                    'region' => $this->s3Config['region'] ?? 'us-east-1',
                    'bucket' => $this->s3Config['bucket'],
                    'url' => $this->s3Config['url'] ?? null,
                    'endpoint' => $this->s3Config['endpoint'] ?? null,
                    'use_path_style_endpoint' => $this->s3Config['use_path_style'] ?? false,
                    'throw' => false,
                ]);

                // Tester la connexion
                $this->s3Available = $this->testS3Connection();

                if ($this->s3Available) {
                    $this->disk = 'tenant_s3';
                    Log::debug('TenantStorageManager: S3 connection successful');
                }
            }
        } catch (\Exception $e) {
            Log::warning('TenantStorageManager: S3 initialization failed, using local storage', [
                'error' => $e->getMessage(),
            ]);
            $this->s3Available = false;
            $this->disk = 'local';
        }
    }

    /**
     * Teste la connexion S3
     */
    protected function testS3Connection(): bool
    {
        try {
            // Test avec une écriture/suppression plutôt que exists()
            // car certains providers (comme Cloudflare R2) peuvent avoir des permissions limitées
            $testFile = '.connection-test-' . uniqid();
            Storage::disk('tenant_s3')->put($testFile, 'test');
            Storage::disk('tenant_s3')->delete($testFile);
            return true;
        } catch (\Exception $e) {
            Log::warning('TenantStorageManager: S3 connection test failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Vérifie si S3 est disponible
     */
    public function isS3Available(): bool
    {
        return $this->s3Available;
    }

    /**
     * Retourne le disque actuellement utilisé
     */
    public function getCurrentDisk(): string
    {
        return $this->disk;
    }

    /**
     * Initialise la structure de base d'un tenant
     * Cette méthode crée la structure complète conforme à Symfony 1
     */
    public function initializeTenantStructure(int $tenantId): void
    {
        $basePath = $this->getTenantPath($tenantId);

        try {
            foreach ($this->baseTenantStructure as $folder) {
                $this->createFolder("{$basePath}/{$folder}");
            }

            $this->logInfo('Tenant base structure initialized', [
                'tenant_id' => $tenantId,
                'path' => $basePath,
                'disk' => $this->disk,
                'folders_created' => count($this->baseTenantStructure),
            ]);
        } catch (\Exception $e) {
            throw StorageException::creationFailed($basePath, $e->getMessage());
        }
    }

    /**
     * Vérifie si la structure de base du tenant existe
     */
    public function tenantStructureExists(int $tenantId): bool
    {
        $basePath = $this->getTenantPath($tenantId);

        try {
            // Vérifier l'existence du dossier admin/data/settings (structure de base)
            if ($this->isS3Storage()) {
                return Storage::disk($this->disk)->exists("{$basePath}/admin/data/settings/.keep");
            }
            return Storage::disk($this->disk)->exists("{$basePath}/admin/data/settings");
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Crée la structure de fichiers pour un module
     * Utilise les dossiers définis dans $moduleStructures ou les dossiers par défaut
     */
    public function createModuleStructure(int $tenantId, string $moduleName): void
    {
        $basePath = $this->getTenantPath($tenantId);

        // S'assurer que la structure de base existe
        if (!$this->tenantStructureExists($tenantId)) {
            $this->initializeTenantStructure($tenantId);
        }

        try {
            // Récupérer les dossiers spécifiques au module ou utiliser une structure par défaut
            $folders = $this->getModuleFolders($moduleName);

            foreach ($folders as $folder) {
                $this->createFolder("{$basePath}/{$folder}");
            }

            // Créer le dossier install pour les migrations SQL du module
            $installPath = "{$basePath}/install/" . strtolower($moduleName);
            $this->createFolder("{$installPath}/install");

            $this->logInfo('Module structure created', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $basePath,
                'disk' => $this->disk,
                'folders_created' => count($folders) + 1,
            ]);
        } catch (\Exception $e) {
            throw StorageException::creationFailed($basePath, $e->getMessage());
        }
    }

    /**
     * Retourne les dossiers à créer pour un module
     */
    protected function getModuleFolders(string $moduleName): array
    {
        // Chercher une correspondance exacte ou partielle
        foreach ($this->moduleStructures as $key => $folders) {
            if (strcasecmp($key, $moduleName) === 0 || stripos($moduleName, $key) !== false) {
                return $folders;
            }
        }

        // Structure par défaut pour les modules inconnus
        $moduleKey = strtolower($moduleName);
        return [
            "admin/data/{$moduleKey}",
            "admin/data/{$moduleKey}/imports",
            "admin/data/{$moduleKey}/exports",
            "frontend/data/{$moduleKey}",
        ];
    }

    /**
     * Crée un dossier (avec .keep pour S3)
     */
    protected function createFolder(string $path): void
    {
        if ($this->isS3Storage()) {
            // Sur S3, les dossiers sont virtuels - créer un fichier .keep
            $keepFile = rtrim($path, '/') . '/.keep';
            if (!Storage::disk($this->disk)->exists($keepFile)) {
                Storage::disk($this->disk)->put($keepFile, 'Folder created by TenantStorageManager');
            }
        } else {
            // Stockage local - créer le dossier
            if (!Storage::disk($this->disk)->exists($path)) {
                Storage::disk($this->disk)->makeDirectory($path);
            }
        }
    }

    /**
     * Vérifie si on utilise un stockage S3
     */
    protected function isS3Storage(): bool
    {
        return $this->disk === 'tenant_s3' || $this->disk === 's3';
    }

    /**
     * Vérifie si la structure du module existe
     */
    public function moduleStructureExists(int $tenantId, string $moduleName): bool
    {
        $basePath = $this->getTenantPath($tenantId);
        $folders = $this->getModuleFolders($moduleName);

        if (empty($folders)) {
            return false;
        }

        try {
            $firstFolder = $folders[0];
            if ($this->isS3Storage()) {
                return Storage::disk($this->disk)->exists("{$basePath}/{$firstFolder}/.keep");
            }
            return Storage::disk($this->disk)->exists("{$basePath}/{$firstFolder}");
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Retourne le chemin de base pour un tenant
     * Utilise site_db_name comme nom de dossier (ex: "tenants/site_theme32")
     */
    public function getTenantPath(int $tenantId): string
    {
        $folderName = $this->resolveTenantFolder($tenantId);
        return "tenants/{$folderName}";
    }

    /**
     * Retourne le chemin admin/data pour un tenant
     */
    public function getAdminDataPath(int $tenantId): string
    {
        return $this->getTenantPath($tenantId) . '/admin/data';
    }

    /**
     * Retourne le chemin frontend/data pour un tenant
     */
    public function getFrontendDataPath(int $tenantId): string
    {
        return $this->getTenantPath($tenantId) . '/frontend/data';
    }

    /**
     * Retourne le chemin frontend/view/data pour un tenant (assets publics)
     */
    public function getFrontendViewDataPath(int $tenantId): string
    {
        return $this->getTenantPath($tenantId) . '/frontend/view/data';
    }

    /**
     * Retourne le chemin pour un type spécifique de données
     * @param string $type Exemples: 'customers/documents', 'contracts/exports', 'partners'
     * @param string $layer 'admin' ou 'frontend'
     * @param string $dataType 'data' ou 'view/data'
     */
    public function getDataPath(int $tenantId, string $type, string $layer = 'admin', string $dataType = 'data'): string
    {
        return $this->getTenantPath($tenantId) . "/{$layer}/{$dataType}/{$type}";
    }

    /**
     * Retourne le chemin pour un document spécifique
     * @param int $entityId ID de l'entité (customer_id, contract_id, etc.)
     */
    public function getEntityPath(int $tenantId, string $type, int $entityId, string $layer = 'admin'): string
    {
        return $this->getTenantPath($tenantId) . "/{$layer}/data/{$type}/{$entityId}";
    }

    /**
     * Retourne le chemin pour les assets d'une company
     */
    public function getCompanyAssetsPath(int $tenantId, int $companyId, string $category = 'site'): string
    {
        return $this->getTenantPath($tenantId) . "/frontend/view/data/{$category}/company/{$companyId}";
    }

    /**
     * Liste les fichiers d'un chemin
     */
    public function listFiles(int $tenantId, string $relativePath): array
    {
        $path = $this->getTenantPath($tenantId) . "/{$relativePath}";

        try {
            return Storage::disk($this->disk)->allFiles($path);
        } catch (\League\Flysystem\UnableToListContents $e) {
            Log::warning('TenantStorageManager: Unable to list files (permission issue)', [
                'tenant_id' => $tenantId,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Liste tous les fichiers d'un module (ancienne méthode pour compatibilité)
     */
    public function listModuleFiles(int $tenantId, string $moduleName): array
    {
        $folders = $this->getModuleFolders($moduleName);
        $allFiles = [];

        foreach ($folders as $folder) {
            $files = $this->listFiles($tenantId, $folder);
            $allFiles = array_merge($allFiles, $files);
        }

        return $allFiles;
    }

    /**
     * Retourne la taille totale des fichiers d'un chemin
     */
    public function getPathSize(int $tenantId, string $relativePath): int
    {
        $files = $this->listFiles($tenantId, $relativePath);

        if (empty($files)) {
            return 0;
        }

        $totalSize = 0;
        foreach ($files as $file) {
            try {
                $totalSize += Storage::disk($this->disk)->size($file);
            } catch (\Exception $e) {
                continue;
            }
        }

        return $totalSize;
    }

    /**
     * Retourne la taille totale d'un module
     */
    public function getModuleSize(int $tenantId, string $moduleName): int
    {
        $folders = $this->getModuleFolders($moduleName);
        $totalSize = 0;

        foreach ($folders as $folder) {
            $totalSize += $this->getPathSize($tenantId, $folder);
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

        try {
            $content = Storage::disk($this->disk)->get($configPath);

            if (empty($content)) {
                return null;
            }

            $config = json_decode($content, true);

            if (!is_array($config)) {
                return null;
            }

            return $this->decryptSensitiveData($config);
        } catch (\League\Flysystem\UnableToReadFile $e) {
            return null;
        } catch (\Exception $e) {
            Log::warning('TenantStorageManager: Unable to read module config', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $configPath,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Supprime la configuration d'un module
     */
    public function deleteModuleConfig(int $tenantId, string $moduleName): void
    {
        $configPath = $this->getConfigPath($tenantId, $moduleName);

        try {
            Storage::disk($this->disk)->delete($configPath);

            $this->logInfo('Module config deleted', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'path' => $configPath,
            ]);
        } catch (\League\Flysystem\UnableToDeleteFile $e) {
            $this->logInfo('Module config already deleted or does not exist', [
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
        }
    }

    /**
     * Retourne le chemin du fichier de config
     */
    protected function getConfigPath(int $tenantId, string $moduleName): string
    {
        return $this->getTenantPath($tenantId) . "/config/module_{$moduleName}.json";
    }

    /**
     * Sauvegarde un fichier de settings (format .dat comme Symfony 1)
     */
    public function saveSettings(int $tenantId, string $name, array $data, string $layer = 'admin'): void
    {
        $path = $this->getTenantPath($tenantId) . "/{$layer}/data/settings/{$name}.dat";

        try {
            $content = serialize($this->encryptSensitiveData($data));
            Storage::disk($this->disk)->put($path, $content);
        } catch (\Exception $e) {
            throw StorageException::creationFailed($path, $e->getMessage());
        }
    }

    /**
     * Lit un fichier de settings
     */
    public function readSettings(int $tenantId, string $name, string $layer = 'admin'): ?array
    {
        $path = $this->getTenantPath($tenantId) . "/{$layer}/data/settings/{$name}.dat";

        try {
            $content = Storage::disk($this->disk)->get($path);

            if (empty($content)) {
                return null;
            }

            $data = @unserialize($content);

            if (!is_array($data)) {
                return null;
            }

            return $this->decryptSensitiveData($data);
        } catch (\Exception $e) {
            return null;
        }
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
        $basePath = $this->getTenantPath($tenantId);
        $folders = $this->getModuleFolders($moduleName);

        try {
            $filesDeleted = 0;

            foreach ($folders as $folder) {
                $fullPath = "{$basePath}/{$folder}";
                $filesDeleted += $this->deleteDirectoryRecursive($fullPath);
            }

            // Supprimer le dossier install du module
            $installPath = "{$basePath}/install/" . strtolower($moduleName);
            $filesDeleted += $this->deleteDirectoryRecursive($installPath);

            $this->logInfo('Module storage deleted', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'folders' => $folders,
                'files_deleted' => $filesDeleted,
                'disk' => $this->disk,
            ]);
        } catch (\Exception $e) {
            $this->logError('Module storage deletion failed', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'error' => $e->getMessage(),
            ]);
            throw StorageException::deletionFailed($basePath, $e->getMessage());
        }
    }

    /**
     * Supprime récursivement tous les fichiers d'un dossier
     * Supporte S3/R2 et stockage local
     */
    protected function deleteDirectoryRecursive(string $path): int
    {
        $filesDeleted = 0;

        if ($this->isS3Storage()) {
            // Sur S3/R2, utiliser l'API native pour supprimer par préfixe
            $filesDeleted = $this->deleteS3Prefix($path);
        } else {
            // Stockage local
            try {
                if (Storage::disk($this->disk)->exists($path)) {
                    $files = Storage::disk($this->disk)->allFiles($path);
                    $filesDeleted = count($files);

                    foreach ($files as $file) {
                        Storage::disk($this->disk)->delete($file);
                    }

                    // Supprimer les sous-dossiers
                    $directories = Storage::disk($this->disk)->allDirectories($path);
                    foreach (array_reverse($directories) as $dir) {
                        Storage::disk($this->disk)->deleteDirectory($dir);
                    }

                    // Supprimer le dossier principal
                    Storage::disk($this->disk)->deleteDirectory($path);
                }
            } catch (\Exception $e) {
                Log::warning('TenantStorageManager: Local directory deletion failed', [
                    'path' => $path,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $filesDeleted;
    }

    /**
     * Supprime tous les objets S3 avec un préfixe donné
     * Utilise l'API native S3 pour une suppression efficace
     */
    protected function deleteS3Prefix(string $prefix): int
    {
        $filesDeleted = 0;

        // S'assurer que le préfixe se termine par /
        $prefix = rtrim($prefix, '/') . '/';

        try {
            // Méthode 1: Utiliser l'API S3 native si disponible
            if ($this->s3Config && class_exists(\Aws\S3\S3Client::class)) {
                $client = new \Aws\S3\S3Client([
                    'version' => 'latest',
                    'region' => $this->s3Config['region'] ?? 'us-east-1',
                    'endpoint' => $this->s3Config['endpoint'] ?? null,
                    'use_path_style_endpoint' => filter_var($this->s3Config['use_path_style'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'credentials' => [
                        'key' => $this->s3Config['access_key'],
                        'secret' => $this->s3Config['secret_key'],
                    ],
                ]);

                $bucket = $this->s3Config['bucket'];

                // Lister tous les objets avec ce préfixe
                $objects = [];
                $params = [
                    'Bucket' => $bucket,
                    'Prefix' => $prefix,
                ];

                do {
                    $result = $client->listObjectsV2($params);

                    if (!empty($result['Contents'])) {
                        foreach ($result['Contents'] as $object) {
                            $objects[] = ['Key' => $object['Key']];
                            $filesDeleted++;
                        }
                    }

                    $params['ContinuationToken'] = $result['NextContinuationToken'] ?? null;
                } while (!empty($params['ContinuationToken']));

                // Supprimer les objets par lots de 1000 (limite S3)
                if (!empty($objects)) {
                    $chunks = array_chunk($objects, 1000);
                    foreach ($chunks as $chunk) {
                        $client->deleteObjects([
                            'Bucket' => $bucket,
                            'Delete' => [
                                'Objects' => $chunk,
                                'Quiet' => true,
                            ],
                        ]);
                    }

                    Log::info('TenantStorageManager: S3 objects deleted via API', [
                        'prefix' => $prefix,
                        'count' => $filesDeleted,
                    ]);
                }

                return $filesDeleted;
            }
        } catch (\Aws\S3\Exception\S3Exception $e) {
            // Si ListObjectsV2 n'est pas autorisé, essayer la méthode Flysystem
            Log::warning('TenantStorageManager: S3 API deletion failed, trying Flysystem', [
                'prefix' => $prefix,
                'error' => $e->getMessage(),
            ]);
        } catch (\Exception $e) {
            Log::warning('TenantStorageManager: S3 API deletion failed', [
                'prefix' => $prefix,
                'error' => $e->getMessage(),
            ]);
        }

        // Méthode 2: Fallback vers Flysystem
        try {
            $files = Storage::disk($this->disk)->allFiles(rtrim($prefix, '/'));
            foreach ($files as $file) {
                try {
                    Storage::disk($this->disk)->delete($file);
                    $filesDeleted++;
                } catch (\Exception $e) {
                    // Continuer avec les autres fichiers
                }
            }

            Log::info('TenantStorageManager: S3 objects deleted via Flysystem', [
                'prefix' => $prefix,
                'count' => $filesDeleted,
            ]);
        } catch (\League\Flysystem\UnableToListContents $e) {
            // R2 sans permission de listing - supprimer les .keep connus
            Log::warning('TenantStorageManager: Cannot list S3 contents, deleting known .keep files only', [
                'prefix' => $prefix,
            ]);

            // Supprimer au moins le .keep qu'on a créé
            try {
                Storage::disk($this->disk)->delete(rtrim($prefix, '/') . '/.keep');
                $filesDeleted++;
            } catch (\Exception $e) {
                // Ignorer
            }
        }

        return $filesDeleted;
    }

    /**
     * Vérifie si des fichiers existent dans la structure du module
     */
    public function hasModuleFiles(int $tenantId, string $moduleName): bool
    {
        $files = $this->listModuleFiles($tenantId, $moduleName);
        if (!empty($files)) {
            return true;
        }

        // Si vide, vérifier la structure
        return $this->moduleStructureExists($tenantId, $moduleName);
    }

    /**
     * Compte les fichiers d'un module
     */
    public function countModuleFiles(int $tenantId, string $moduleName): int
    {
        $files = $this->listModuleFiles($tenantId, $moduleName);

        if (empty($files) && $this->moduleStructureExists($tenantId, $moduleName)) {
            return -1; // Indique que le comptage n'est pas disponible
        }

        return count($files);
    }

    /**
     * Crée un backup des fichiers d'un module
     */
    public function backupModule(int $tenantId, string $moduleName): ?string
    {
        $basePath = $this->getTenantPath($tenantId);
        $date = now()->format('Y-m-d_His');
        $backupName = "backup_{$moduleName}_{$date}.zip";
        $backupPath = "{$basePath}/backups/{$backupName}";

        $files = $this->listModuleFiles($tenantId, $moduleName);

        if (empty($files)) {
            $this->logInfo('No files to backup, skipping', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
            ]);
            return null;
        }

        try {
            $zip = new \ZipArchive();
            $tempPath = tempnam(sys_get_temp_dir(), 'backup_');

            if ($zip->open($tempPath, \ZipArchive::CREATE) !== true) {
                throw new \Exception('Failed to create ZIP archive');
            }

            $filesAdded = 0;
            foreach ($files as $file) {
                try {
                    $content = Storage::disk($this->disk)->get($file);
                    $relativePath = str_replace("{$basePath}/", '', $file);
                    $zip->addFromString($relativePath, $content);
                    $filesAdded++;
                } catch (\Exception $e) {
                    $this->logWarning('Could not add file to backup', ['file' => $file, 'error' => $e->getMessage()]);
                }
            }

            $zip->close();

            if ($filesAdded === 0) {
                unlink($tempPath);
                return null;
            }

            Storage::disk($this->disk)->put($backupPath, file_get_contents($tempPath));
            unlink($tempPath);

            $this->logInfo('Module backup created', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'backup_path' => $backupPath,
                'files_count' => $filesAdded,
            ]);

            return $backupPath;

        } catch (\Exception $e) {
            $this->logError('Module backup failed', [
                'tenant_id' => $tenantId,
                'module' => $moduleName,
                'error' => $e->getMessage(),
            ]);

            if (isset($tempPath) && file_exists($tempPath)) {
                unlink($tempPath);
            }

            throw StorageException::backupFailed($basePath, $e->getMessage());
        }
    }

    /**
     * Liste les backups d'un tenant
     */
    public function listBackups(int $tenantId, ?string $moduleName = null): array
    {
        $path = "tenants/{$tenantId}/backups/";

        try {
            $files = Storage::disk($this->disk)->files($path);
        } catch (\League\Flysystem\UnableToListContents $e) {
            return [];
        } catch (\Exception $e) {
            return [];
        }

        $backups = [];
        foreach ($files as $file) {
            if ($moduleName && !str_contains($file, "backup_{$moduleName}_")) {
                continue;
            }

            $size = 0;
            $modified = 0;
            try {
                $size = Storage::disk($this->disk)->size($file);
                $modified = Storage::disk($this->disk)->lastModified($file);
            } catch (\Exception $e) {
                // Ignorer
            }

            $backups[] = [
                'path' => $file,
                'name' => basename($file),
                'size' => $size,
                'created_at' => $modified,
            ];
        }

        return $backups;
    }

    /**
     * Supprime un backup
     */
    public function deleteBackup(string $backupPath): void
    {
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

    /**
     * Upload un fichier vers le stockage tenant
     */
    public function uploadFile(int $tenantId, string $relativePath, $content, string $filename): string
    {
        $fullPath = $this->getTenantPath($tenantId) . "/{$relativePath}/{$filename}";

        try {
            Storage::disk($this->disk)->put($fullPath, $content);
            return $fullPath;
        } catch (\Exception $e) {
            throw StorageException::creationFailed($fullPath, $e->getMessage());
        }
    }

    /**
     * Télécharge un fichier depuis le stockage tenant
     */
    public function downloadFile(int $tenantId, string $relativePath): ?string
    {
        $fullPath = $this->getTenantPath($tenantId) . "/{$relativePath}";

        try {
            return Storage::disk($this->disk)->get($fullPath);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Supprime un fichier du stockage tenant
     */
    public function deleteFile(int $tenantId, string $relativePath): bool
    {
        $fullPath = $this->getTenantPath($tenantId) . "/{$relativePath}";

        try {
            Storage::disk($this->disk)->delete($fullPath);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Retourne l'URL publique d'un fichier (si disponible)
     */
    public function getFileUrl(int $tenantId, string $relativePath): ?string
    {
        $fullPath = $this->getTenantPath($tenantId) . "/{$relativePath}";

        try {
            return Storage::disk($this->disk)->url($fullPath);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Retourne une URL temporaire signée pour un fichier (S3 uniquement)
     */
    public function getTemporaryUrl(int $tenantId, string $relativePath, int $minutes = 60): ?string
    {
        if (!$this->isS3Storage()) {
            return $this->getFileUrl($tenantId, $relativePath);
        }

        $fullPath = $this->getTenantPath($tenantId) . "/{$relativePath}";

        try {
            return Storage::disk($this->disk)->temporaryUrl($fullPath, now()->addMinutes($minutes));
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Retourne le chemin de base pour un module d'un tenant (compatibilité)
     * @deprecated Utiliser les méthodes spécifiques getAdminDataPath, getFrontendDataPath, etc.
     */
    public function getModulePath(int $tenantId, string $moduleName): string
    {
        $moduleKey = strtolower($moduleName);
        return $this->getTenantPath($tenantId) . "/admin/data/{$moduleKey}";
    }
}
