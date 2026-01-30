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

        // Analyser les fichiers
        $files = $this->storageManager->listModuleFiles($tenant->site_id, $moduleName);
        $totalSize = $this->storageManager->getModuleSize($tenant->site_id, $moduleName);

        // Analyser les dépendances
        $depCheck = $this->dependencyResolver->canDeactivate($moduleName, $tenant->site_id);

        // Lire la config du module
        $config = $this->storageManager->readModuleConfig($tenant->site_id, $moduleName);

        $impact = new DeactivationImpact(
            moduleName: $moduleName,
            tenantId: $tenant->site_id,
            fileCount: count($files),
            totalSizeBytes: $totalSize,
            canDeactivate: $depCheck['can_deactivate'],
            blockingModules: $depCheck['blocking_modules'],
            hasConfig: $config !== null,
            warnings: $this->generateWarnings($files, $totalSize, $depCheck)
        );

        $this->logInfo('Deactivation impact analysis completed', [
            'tenant_id' => $tenant->site_id,
            'module' => $moduleName,
            'file_count' => count($files),
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
