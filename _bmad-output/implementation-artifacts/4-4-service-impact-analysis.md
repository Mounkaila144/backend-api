# Story 4.4: Service Impact Analysis

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **voir l'impact avant de désactiver un module**,
so that **je sais ce qui sera supprimé**.

---

## Acceptance Criteria

1. **Given** un module actif
   **When** j'appelle `analyzeDeactivationImpact($tenant, $module)`
   **Then** je reçois: nombre de fichiers, taille totale, tables concernées

2. **Given** un module avec des dépendants actifs
   **When** j'analyse l'impact
   **Then** la liste des modules dépendants bloquants est retournée

3. **Given** l'analyse d'impact
   **When** je l'affiche à l'utilisateur
   **Then** il peut prendre une décision éclairée

---

## Tasks / Subtasks

- [x] **Task 1: Créer le service ImpactAnalyzer** (AC: #1)
  - [x] Créer `Modules/Superadmin/Services/ImpactAnalyzer.php`
  - [x] Compter les fichiers et leur taille
  - [x] Lister les tables du module

- [x] **Task 2: Intégrer les dépendances** (AC: #2)
  - [x] Utiliser `ModuleDependencyResolver::canDeactivate()`
  - [x] Retourner les modules bloquants

- [x] **Task 3: Formater le résultat** (AC: #3)
  - [x] Créer une structure claire
  - [x] Faciliter l'affichage UI

---

## Dev Notes

### ImpactAnalyzer

```php
<?php

namespace Modules\Superadmin\Services;

use App\Models\Tenant;

class ImpactAnalyzer
{
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
            throw new \InvalidArgumentException("Module '{$moduleName}' is not active for this tenant");
        }

        // Analyser les fichiers
        $files = $this->storageManager->listModuleFiles($tenant->site_id, $moduleName);
        $totalSize = $this->storageManager->getModuleSize($tenant->site_id, $moduleName);

        // Analyser les dépendances
        $depCheck = $this->dependencyResolver->canDeactivate($moduleName, $tenant->site_id);

        // Lire la config du module
        $config = $this->storageManager->readModuleConfig($tenant->site_id, $moduleName);

        return new DeactivationImpact(
            moduleName: $moduleName,
            tenantId: $tenant->site_id,
            fileCount: count($files),
            totalSizeBytes: $totalSize,
            canDeactivate: $depCheck['can_deactivate'],
            blockingModules: $depCheck['blocking_modules'],
            hasConfig: $config !== null,
            warnings: $this->generateWarnings($files, $totalSize, $depCheck)
        );
    }

    /**
     * Génère des avertissements basés sur l'analyse
     */
    protected function generateWarnings(array $files, int $size, array $depCheck): array
    {
        $warnings = [];

        if (count($files) > 100) {
            $warnings[] = "Large number of files will be deleted ({$files} files)";
        }

        if ($size > 100 * 1024 * 1024) { // 100 MB
            $warnings[] = "Large amount of data will be deleted (" . $this->formatBytes($size) . ")";
        }

        if (!$depCheck['can_deactivate']) {
            $warnings[] = "Blocking modules must be deactivated first: " . implode(', ', $depCheck['blocking_modules']);
        }

        return $warnings;
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
```

### DeactivationImpact DTO

```php
<?php

namespace Modules\Superadmin\Services;

class DeactivationImpact
{
    public function __construct(
        public string $moduleName,
        public int $tenantId,
        public int $fileCount,
        public int $totalSizeBytes,
        public bool $canDeactivate,
        public array $blockingModules,
        public bool $hasConfig,
        public array $warnings
    ) {}

    public function toArray(): array
    {
        return [
            'module_name' => $this->moduleName,
            'tenant_id' => $this->tenantId,
            'file_count' => $this->fileCount,
            'total_size_bytes' => $this->totalSizeBytes,
            'total_size_human' => $this->formatBytes($this->totalSizeBytes),
            'can_deactivate' => $this->canDeactivate,
            'blocking_modules' => $this->blockingModules,
            'has_config' => $this->hasConfig,
            'warnings' => $this->warnings,
        ];
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes === 0) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes, 1024));
        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }
}
```

### Format de Réponse

```json
{
    "module_name": "CustomersContracts",
    "tenant_id": 1,
    "file_count": 47,
    "total_size_bytes": 15728640,
    "total_size_human": "15 MB",
    "can_deactivate": true,
    "blocking_modules": [],
    "has_config": true,
    "warnings": []
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR18]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.4]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Créé le DTO `DeactivationImpact` avec toutes les propriétés requises
- ✅ Créé le service `ImpactAnalyzer` avec injection de dépendances
- ✅ Implémenté `analyzeDeactivationImpact()` pour analyser l'impact complet
- ✅ Intégré `ModuleDependencyResolver::canDeactivate()` pour vérifier les blocages
- ✅ Comptage des fichiers et calcul de la taille totale
- ✅ Génération d'avertissements intelligents basés sur l'analyse
- ✅ Format de retour clair avec `toArray()` pour faciliter l'affichage UI
- ✅ Logging complet de toutes les opérations

### File List
- Modules/Superadmin/Services/ImpactAnalyzer.php
- Modules/Superadmin/Services/DeactivationImpact.php

## Change Log
- 2026-01-28: Création du service d'analyse d'impact de désactivation

