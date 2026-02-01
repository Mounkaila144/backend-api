<?php

namespace Modules\Superadmin\Services;

use App\Models\Tenant;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

class ImpactAnalyzer
{
    use LogsSuperadminActivity;

    public function __construct(
        private TenantStorageManagerInterface $storageManager,
        private ModuleDependencyResolverInterface $dependencyResolver,
        private ModuleDiscoveryInterface $moduleDiscovery
    ) {}

    /**
     * Analyse l'impact de la désactivation d'un module
     */
    public function analyzeDeactivationImpact(Tenant $tenant, string $moduleName): DeactivationImpact
    {
        // Vérifier si le module est actif
        if (!$this->moduleDiscovery->isModuleActiveForTenant($tenant->site_id, $moduleName)) {
            $this->logWarning('Attempting to analyze inactive module', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
            ]);
            throw new \InvalidArgumentException("Module '{$moduleName}' is not active for this tenant");
        }

        // Analyser les fichiers (peut retourner vide sur R2 sans permission listing)
        $files = $this->storageManager->listModuleFiles($tenant->site_id, $moduleName);
        $fileCount = $this->storageManager->countModuleFiles($tenant->site_id, $moduleName);
        $totalSize = $this->storageManager->getModuleSize($tenant->site_id, $moduleName);

        // Si fileCount est -1, ça veut dire que le listing n'est pas disponible mais la structure existe
        $listingAvailable = $fileCount >= 0;
        if (!$listingAvailable) {
            $fileCount = 0; // Pour l'affichage, mettre 0 avec un warning
        }

        // Analyser les dépendances
        $depCheck = $this->dependencyResolver->canDeactivate($moduleName, $tenant->site_id);

        // Lire la config du module
        $config = $this->storageManager->readModuleConfig($tenant->site_id, $moduleName);

        // Générer les warnings
        $warnings = $this->generateWarnings($files, $totalSize, $depCheck);
        if (!$listingAvailable) {
            $warnings[] = "File listing not available (R2 permission). Actual file count unknown.";
        }

        $impact = new DeactivationImpact(
            moduleName: $moduleName,
            tenantId: $tenant->site_id,
            fileCount: $fileCount,
            totalSizeBytes: $totalSize,
            canDeactivate: $depCheck['can_deactivate'],
            blockingModules: $depCheck['blocking_modules'],
            hasConfig: $config !== null,
            warnings: $warnings
        );

        $this->logInfo('Deactivation impact analysis completed', [
            'tenant_id' => $tenant->site_id,
            'module' => $moduleName,
            'file_count' => $fileCount,
            'listing_available' => $listingAvailable,
            'total_size' => $totalSize,
            'can_deactivate' => $depCheck['can_deactivate'],
            'blocking_modules' => $depCheck['blocking_modules'],
        ]);

        return $impact;
    }

    /**
     * Génère des avertissements basés sur l'analyse
     */
    protected function generateWarnings(array $files, int $size, array $depCheck): array
    {
        $warnings = [];

        if (count($files) > 100) {
            $warnings[] = "Large number of files will be deleted (" . count($files) . " files)";
        }

        if ($size > 100 * 1024 * 1024) { // 100 MB
            $warnings[] = "Large amount of data will be deleted (" . $this->formatBytes($size) . ")";
        }

        if (!$depCheck['can_deactivate']) {
            $warnings[] = "Blocking modules must be deactivated first: " . implode(', ', $depCheck['blocking_modules']);
        }

        return $warnings;
    }

    /**
     * Formate les octets en format lisible
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
