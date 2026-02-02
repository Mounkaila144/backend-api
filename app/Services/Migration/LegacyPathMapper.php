<?php

namespace App\Services\Migration;

/**
 * LegacyPathMapper
 *
 * Service de mapping des chemins Symfony 1 vers la nouvelle structure Laravel/S3
 *
 * STRUCTURE SYMFONY 1 (ancienne):
 * ================================
 * sites/{site_id}/admin/data/{module}/{entity_type}/{entity_id}/{filename}
 *
 * Exemples:
 * - sites/site_theme32/admin/data/customers/documents/1000/Devis.pdf
 * - sites/site_theme32/admin/data/contracts/exports/format/imports/1/export.xml
 * - sites/site_theme32/admin/data/meetings/imports/file.csv
 * - sites/site_theme32/admin/data/users/pictures/avatar.jpg
 *
 * STRUCTURE LARAVEL/S3 (nouvelle):
 * ================================
 * tenants/{tenant_id}/{module}/{entity_type}/{entity_id}/{filename}
 *
 * Exemples:
 * - tenants/32/customers/documents/1000/Devis.pdf
 * - tenants/32/contracts/exports/1/export.xml
 * - tenants/32/meetings/imports/file.csv
 * - tenants/32/users/pictures/1/avatar.jpg
 */
class LegacyPathMapper
{
    /**
     * Mapping des noms de sites Symfony vers tenant IDs
     * Format: 'site_theme{N}' => {N}
     */
    protected array $siteMapping = [];

    /**
     * Chemin de base de l'ancien projet Symfony
     */
    protected string $legacyBasePath;

    /**
     * Mapping des modules Symfony vers modules Laravel
     */
    protected array $moduleMapping = [
        'customers' => 'customers',
        'customers_contracts' => 'contracts',
        'customers_contracts_documents' => 'contracts',
        'customers_documents' => 'customers',
        'customers_meetings' => 'meetings',
        'customers_communication' => 'communication',
        'customers_communication_emails' => 'emails',
        'users' => 'users',
        'products' => 'products',
        'services' => 'services',
    ];

    /**
     * Mapping des types de fichiers par module
     */
    protected array $fileTypeMapping = [
        'customers' => [
            'documents' => 'documents',
            'verif' => 'verification',
            'pictures' => 'pictures',
        ],
        'contracts' => [
            'exports' => 'exports',
            'imports' => 'imports',
            'documents' => 'documents',
        ],
        'meetings' => [
            'imports' => 'imports',
            'attachments' => 'attachments',
        ],
        'users' => [
            'pictures' => 'pictures',
            'documents' => 'documents',
        ],
    ];

    public function __construct(string $legacyBasePath = null)
    {
        $this->legacyBasePath = $legacyBasePath ?? config('migration.legacy_path', 'C:/xampp/htdocs/project');
    }

    /**
     * Extrait le tenant ID à partir du nom de site Symfony
     *
     * @param string $siteName Ex: 'site_theme32', 'site_dev1'
     * @return int|null
     */
    public function extractTenantId(string $siteName): ?int
    {
        // Pattern: site_theme{N} ou site_dev{N}
        if (preg_match('/^site_(?:theme|dev)(\d+)$/', $siteName, $matches)) {
            return (int) $matches[1];
        }

        // Vérifier le mapping personnalisé
        if (isset($this->siteMapping[$siteName])) {
            return $this->siteMapping[$siteName];
        }

        return null;
    }

    /**
     * Convertit un chemin Symfony 1 vers le nouveau format Laravel/S3
     *
     * @param string $legacyPath Chemin complet ou relatif Symfony
     * @return array|null ['tenant_id', 'module', 'type', 'entity_id', 'filename', 'new_path']
     */
    public function parseLegacyPath(string $legacyPath): ?array
    {
        // Normaliser le chemin
        $path = str_replace('\\', '/', $legacyPath);

        // Pattern: sites/{site_id}/admin/data/{module}/{type}/{entity_id}/{filename}
        $pattern = '/sites\/([^\/]+)\/admin\/data\/([^\/]+)\/(.+)$/';

        if (!preg_match($pattern, $path, $matches)) {
            return null;
        }

        $siteName = $matches[1];
        $module = $matches[2];
        $remainingPath = $matches[3];

        $tenantId = $this->extractTenantId($siteName);
        if ($tenantId === null) {
            return null;
        }

        // Parser le reste du chemin
        $parts = explode('/', $remainingPath);

        // Déterminer le type et l'entity_id
        $type = $parts[0] ?? 'default';
        $entityId = null;
        $filename = null;
        $subPath = '';

        // Cas spécial: exports/format/imports/{n}/file.xml
        if ($type === 'exports' && isset($parts[1]) && $parts[1] === 'format' && isset($parts[2]) && $parts[2] === 'imports') {
            $type = 'exports';
            $entityId = $parts[3] ?? null;
            $filename = $parts[4] ?? null;
            $subPath = implode('/', array_slice($parts, 4));
        }
        // Cas standard: {type}/{entity_id}/{filename}
        elseif (count($parts) >= 3) {
            $entityId = $parts[1];
            $filename = end($parts);
            $subPath = implode('/', array_slice($parts, 2));
        }
        // Cas simple: {type}/{filename}
        elseif (count($parts) === 2) {
            $filename = $parts[1];
            $subPath = $parts[1];
        }
        else {
            $filename = $parts[0];
            $subPath = $parts[0];
        }

        // Mapper le module
        $mappedModule = $this->moduleMapping[$module] ?? $module;
        $mappedType = $this->fileTypeMapping[$mappedModule][$type] ?? $type;

        // Construire le nouveau chemin
        $newPath = "tenants/{$tenantId}/{$mappedModule}/{$mappedType}";
        if ($entityId) {
            $newPath .= "/{$entityId}";
        }
        if ($filename && $filename !== $entityId) {
            $newPath .= "/{$filename}";
        }

        return [
            'tenant_id' => $tenantId,
            'site_name' => $siteName,
            'module' => $mappedModule,
            'original_module' => $module,
            'type' => $mappedType,
            'original_type' => $type,
            'entity_id' => $entityId,
            'filename' => $filename,
            'sub_path' => $subPath,
            'legacy_path' => $legacyPath,
            'new_path' => $newPath,
        ];
    }

    /**
     * Convertit un nouveau chemin Laravel/S3 vers l'ancien format Symfony
     * Utile pour la rétro-compatibilité
     *
     * @param string $newPath
     * @return string|null
     */
    public function convertToLegacyPath(string $newPath): ?string
    {
        // Pattern: tenants/{tenant_id}/{module}/{type}/{entity_id}/{filename}
        $pattern = '/^tenants\/(\d+)\/([^\/]+)\/([^\/]+)\/(.+)$/';

        if (!preg_match($pattern, $newPath, $matches)) {
            return null;
        }

        $tenantId = $matches[1];
        $module = $matches[2];
        $type = $matches[3];
        $remainingPath = $matches[4];

        // Trouver le nom de site correspondant
        $siteName = $this->findSiteName($tenantId);
        if (!$siteName) {
            $siteName = "site_theme{$tenantId}";
        }

        // Mapper vers l'ancien module
        $legacyModule = array_search($module, $this->moduleMapping) ?: $module;

        return "sites/{$siteName}/admin/data/{$legacyModule}/{$type}/{$remainingPath}";
    }

    /**
     * Liste tous les fichiers d'un site Symfony
     *
     * @param string $siteName
     * @return \Generator
     */
    public function listLegacyFiles(string $siteName): \Generator
    {
        $dataPath = "{$this->legacyBasePath}/sites/{$siteName}/admin/data";

        if (!is_dir($dataPath)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dataPath, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $relativePath = str_replace('\\', '/', $file->getPathname());
                $parsed = $this->parseLegacyPath($relativePath);

                if ($parsed) {
                    $parsed['full_path'] = $file->getPathname();
                    $parsed['size'] = $file->getSize();
                    $parsed['modified'] = $file->getMTime();
                    yield $parsed;
                }
            }
        }
    }

    /**
     * Liste tous les sites disponibles dans l'ancien projet
     *
     * @return array
     */
    public function listLegacySites(): array
    {
        $sitesPath = "{$this->legacyBasePath}/sites";
        $sites = [];

        if (!is_dir($sitesPath)) {
            return $sites;
        }

        $dirs = new \DirectoryIterator($sitesPath);
        foreach ($dirs as $dir) {
            if ($dir->isDir() && !$dir->isDot() && strpos($dir->getFilename(), 'site_') === 0) {
                $siteName = $dir->getFilename();
                $tenantId = $this->extractTenantId($siteName);

                $sites[] = [
                    'name' => $siteName,
                    'tenant_id' => $tenantId,
                    'path' => $dir->getPathname(),
                    'has_data' => is_dir($dir->getPathname() . '/admin/data'),
                ];
            }
        }

        return $sites;
    }

    /**
     * Compte les fichiers à migrer pour un site
     *
     * @param string $siteName
     * @return array ['total' => int, 'by_module' => array, 'total_size' => int]
     */
    public function countFilesToMigrate(string $siteName): array
    {
        $stats = [
            'total' => 0,
            'by_module' => [],
            'by_type' => [],
            'total_size' => 0,
        ];

        foreach ($this->listLegacyFiles($siteName) as $file) {
            $stats['total']++;
            $stats['total_size'] += $file['size'];

            $module = $file['module'];
            $type = $file['type'];

            if (!isset($stats['by_module'][$module])) {
                $stats['by_module'][$module] = 0;
            }
            $stats['by_module'][$module]++;

            $key = "{$module}/{$type}";
            if (!isset($stats['by_type'][$key])) {
                $stats['by_type'][$key] = 0;
            }
            $stats['by_type'][$key]++;
        }

        return $stats;
    }

    /**
     * Définit un mapping personnalisé pour un site
     *
     * @param string $siteName
     * @param int $tenantId
     */
    public function setSiteMapping(string $siteName, int $tenantId): void
    {
        $this->siteMapping[$siteName] = $tenantId;
    }

    /**
     * Définit le chemin de base de l'ancien projet
     *
     * @param string $path
     */
    public function setLegacyBasePath(string $path): void
    {
        $this->legacyBasePath = $path;
    }

    /**
     * Trouve le nom de site correspondant à un tenant ID
     *
     * @param int $tenantId
     * @return string|null
     */
    protected function findSiteName(int $tenantId): ?string
    {
        // Chercher dans le mapping personnalisé
        $siteName = array_search($tenantId, $this->siteMapping);
        if ($siteName !== false) {
            return $siteName;
        }

        // Pattern par défaut
        return "site_theme{$tenantId}";
    }

    /**
     * Génère un rapport de migration pour un site
     *
     * @param string $siteName
     * @return array
     */
    public function generateMigrationReport(string $siteName): array
    {
        $stats = $this->countFilesToMigrate($siteName);
        $tenantId = $this->extractTenantId($siteName);

        return [
            'site_name' => $siteName,
            'tenant_id' => $tenantId,
            'summary' => [
                'total_files' => $stats['total'],
                'total_size' => $stats['total_size'],
                'total_size_human' => $this->formatBytes($stats['total_size']),
            ],
            'by_module' => $stats['by_module'],
            'by_type' => $stats['by_type'],
            'legacy_base_path' => $this->legacyBasePath,
            'new_base_path' => "tenants/{$tenantId}",
        ];
    }

    /**
     * Formate les bytes en unité lisible
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
