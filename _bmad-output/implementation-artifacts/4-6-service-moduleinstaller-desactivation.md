# Story 4.6: Service ModuleInstaller - Désactivation

**Status:** review

---

## Story

As a **développeur**,
I want **un service pour désactiver un module pour un tenant**,
so that **la désactivation est orchestrée correctement**.

---

## Acceptance Criteria

1. **Given** un tenant et un module actif
   **When** j'appelle `deactivate($tenant, $module, $options)`
   **Then** les tables sont rollback, S3 supprimé, config supprimée, record mis à jour

2. **Given** l'option backup=true
   **When** je désactive
   **Then** un backup est créé avant suppression

3. **Given** des modules dépendants actifs
   **When** j'essaie de désactiver
   **Then** une exception est levée avec la liste des bloquants

---

## Tasks / Subtasks

- [x] **Task 1: Implémenter deactivate** (AC: #1)
  - [x] Ajouter la méthode à ModuleInstaller
  - [x] Construire la saga de désactivation

- [x] **Task 2: Gérer le backup optionnel** (AC: #2)
  - [x] Option `backup: true/false`
  - [x] Appeler TenantStorageManager::backupModule

- [x] **Task 3: Vérifier les dépendances** (AC: #3)
  - [x] Bloquer si des dépendants sont actifs
  - [x] Message d'erreur explicatif

---

## Dev Notes

### ModuleInstaller - Méthode deactivate

```php
/**
 * Désactive un module pour un tenant
 */
public function deactivate(Tenant $tenant, string $moduleName, array $options = []): SiteModule
{
    $backup = $options['backup'] ?? false;
    $force = $options['force'] ?? false;

    $this->logInfo('Module deactivation started', [
        'tenant_id' => $tenant->site_id,
        'module' => $moduleName,
        'backup' => $backup,
    ]);

    // Vérifier que le module est actif
    $siteModule = SiteModule::forTenant($tenant->site_id)
        ->where('module_name', $moduleName)
        ->active()
        ->first();

    if (!$siteModule) {
        throw ModuleDeactivationException::notActive($moduleName, $tenant->site_id);
    }

    // Vérifier les dépendances (sauf si force)
    if (!$force) {
        $depCheck = $this->dependencyResolver->canDeactivate($moduleName, $tenant->site_id);
        if (!$depCheck['can_deactivate']) {
            throw ModuleDeactivationException::hasBlockingDependents(
                $moduleName,
                $depCheck['blocking_modules']
            );
        }
    }

    // Backup si demandé
    $backupPath = null;
    if ($backup) {
        $backupPath = $this->storageManager->backupModule($tenant->site_id, $moduleName);
    }

    // Construire et exécuter la saga de désactivation
    $saga = $this->buildDeactivationSaga($tenant, $moduleName);

    try {
        $result = $saga->execute();

        // Mettre à jour l'entrée en base
        $siteModule->update([
            'is_active' => 'NO',
            'uninstalled_at' => now(),
        ]);

        // Dispatcher l'event
        ModuleDeactivated::dispatch($siteModule, auth()->id() ?? 0, [
            'backup_path' => $backupPath,
        ]);

        // Invalider le cache
        $this->cache->forgetTenant($tenant->site_id);

        $this->logInfo('Module deactivation completed', [
            'tenant_id' => $tenant->site_id,
            'module' => $moduleName,
            'backup_path' => $backupPath,
        ]);

        return $siteModule->fresh();

    } catch (SagaException $e) {
        $this->logError('Module deactivation failed', [
            'tenant_id' => $tenant->site_id,
            'module' => $moduleName,
            'error' => $e->getMessage(),
        ]);

        throw ModuleDeactivationException::sagaFailed($moduleName, $tenant->site_id, $e);
    }
}

/**
 * Construit la saga de désactivation
 */
protected function buildDeactivationSaga(Tenant $tenant, string $moduleName): SagaOrchestrator
{
    $saga = new SagaOrchestrator();

    // Note: Pour la désactivation, les compensations sont plus délicates
    // On ne peut pas "re-créer" facilement ce qui a été supprimé
    // Donc on fait attention à l'ordre et on log tout

    return $saga
        ->addStep(
            'delete_config',
            fn() => $this->storageManager->deleteModuleConfig($tenant->site_id, $moduleName),
            fn() => null // Pas de compensation facile
        )
        ->addStep(
            'delete_s3_structure',
            fn() => $this->storageManager->deleteModuleStructure($tenant->site_id, $moduleName),
            fn() => null // Pas de compensation facile
        )
        ->addStep(
            'rollback_migrations',
            fn() => $this->migrationRunner->rollbackModuleMigrations($tenant, $moduleName),
            fn() => null // Pas de compensation facile
        );
}
```

### ModuleDeactivationException

```php
<?php

namespace Modules\Superadmin\Exceptions;

use Exception;
use Throwable;

class ModuleDeactivationException extends Exception
{
    public function __construct(
        string $message,
        public string $module = '',
        public int $tenantId = 0,
        public array $blockingModules = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }

    public static function notActive(string $module, int $tenantId): self
    {
        return new self("Module '{$module}' is not active for tenant {$tenantId}", $module, $tenantId);
    }

    public static function hasBlockingDependents(string $module, array $dependents): self
    {
        $list = implode(', ', $dependents);
        return new self(
            "Cannot deactivate '{$module}': blocking modules are active: {$list}",
            $module,
            blockingModules: $dependents
        );
    }

    public static function sagaFailed(string $module, int $tenantId, SagaException $e): self
    {
        return new self(
            "Module deactivation failed: {$e->getMessage()}",
            $module,
            $tenantId,
            previous: $e
        );
    }

    public function context(): array
    {
        return [
            'module' => $this->module,
            'tenant_id' => $this->tenantId,
            'blocking_modules' => $this->blockingModules,
        ];
    }
}
```

### Interface Étendue

```php
interface ModuleInstallerInterface
{
    public function activate(Tenant $tenant, string $moduleName, array $config = []): SiteModule;
    public function deactivate(Tenant $tenant, string $moduleName, array $options = []): SiteModule;
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Module-Lifecycle]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.6]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Créé ModuleDeactivationException avec contexte complet
- ✅ Implémenté la méthode `deactivate()` dans ModuleInstaller
- ✅ Construit la saga de désactivation (config, S3, migrations)
- ✅ Gestion du backup optionnel avant suppression
- ✅ Vérification des dépendances avec blocage approprié
- ✅ Events ModuleDeactivated avec métadonnées
- ✅ Invalidation du cache après désactivation
- ✅ Logging complet de toutes les étapes

### File List
- Modules/Superadmin/Services/ModuleInstaller.php
- Modules/Superadmin/Services/ModuleInstallerInterface.php
- Modules/Superadmin/Exceptions/ModuleDeactivationException.php
- Modules/Superadmin/Events/ModuleDeactivated.php

## Change Log
- 2026-01-28: Implémentation complète du service de désactivation avec saga

