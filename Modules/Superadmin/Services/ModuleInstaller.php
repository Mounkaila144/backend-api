<?php

namespace Modules\Superadmin\Services;

use App\Models\Tenant;
use Modules\Superadmin\Entities\SiteModule;
use Modules\Superadmin\Events\ModuleActivated;
use Modules\Superadmin\Events\ModuleActivationFailed;
use Modules\Superadmin\Events\ModuleDeactivated;
use Modules\Superadmin\Exceptions\ModuleActivationException;
use Modules\Superadmin\Exceptions\ModuleDeactivationException;
use Modules\Superadmin\Exceptions\SagaException;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

class ModuleInstaller implements ModuleInstallerInterface
{
    use LogsSuperadminActivity;

    public function __construct(
        private ModuleDiscoveryInterface $moduleDiscovery,
        private ModuleDependencyResolverInterface $dependencyResolver,
        private TenantStorageManagerInterface $storageManager,
        private TenantMigrationRunnerInterface $migrationRunner,
        private ModuleCacheService $cache
    ) {}

    /**
     * Active un module pour un tenant
     *
     * @return array{siteModule: SiteModule, result: SagaResult}
     */
    public function activate(Tenant $tenant, string $moduleName, array $config = []): array
    {
        $this->logInfo('Module activation started', [
            'tenant_id' => $tenant->site_id,
            'module' => $moduleName,
        ]);

        // Vérifier que le module est activable
        if (!$this->moduleDiscovery->isActivatable($moduleName)) {
            throw ModuleActivationException::moduleNotActivatable($moduleName);
        }

        // Vérifier les dépendances
        $depCheck = $this->dependencyResolver->canActivate($moduleName, $tenant->site_id);
        if (!$depCheck['can_activate']) {
            throw ModuleActivationException::missingDependencies($moduleName, $depCheck['missing']);
        }

        // Vérifier si déjà actif
        if ($this->moduleDiscovery->isModuleActiveForTenant($tenant->site_id, $moduleName)) {
            throw ModuleActivationException::alreadyActive($moduleName, $tenant->site_id);
        }

        // Construire et exécuter la saga
        $saga = $this->buildActivationSaga($tenant, $moduleName, $config);

        try {
            $result = $saga->execute();

            // Créer l'entrée en base
            $siteModule = $this->createSiteModuleRecord($tenant, $moduleName, $config);

            // Dispatcher l'event
            ModuleActivated::dispatch($siteModule, auth()->id() ?? 0);

            // Invalider le cache
            $this->cache->forgetTenant($tenant->site_id);

            $this->logInfo('Module activation completed', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
                'steps' => $result->completedSteps,
            ]);

            return [
                'siteModule' => $siteModule,
                'result' => $result,
            ];

        } catch (SagaException $e) {
            ModuleActivationFailed::dispatch(
                $tenant->site_id,
                $moduleName,
                $e->getMessage(),
                $e->completedSteps,
                auth()->id() ?? 0
            );

            $this->logError('Module activation failed', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
                'error' => $e->getMessage(),
                'completed_steps' => $e->completedSteps,
            ]);

            throw ModuleActivationException::sagaFailed($moduleName, $tenant->site_id, $e);
        }
    }

    /**
     * Active plusieurs modules pour un tenant
     */
    public function activateBatch(Tenant $tenant, array $moduleNames, array $configs = []): BatchResult
    {
        // Résoudre l'ordre des dépendances
        $orderedModules = $this->resolveActivationOrder($moduleNames);

        $results = [
            'success' => [],
            'failed' => [],
            'skipped' => [],
        ];

        foreach ($orderedModules as $moduleName) {
            // Skip si déjà actif
            if ($this->moduleDiscovery->isModuleActiveForTenant($tenant->site_id, $moduleName)) {
                $results['skipped'][] = [
                    'module' => $moduleName,
                    'reason' => 'Already active',
                ];
                continue;
            }

            try {
                $config = $configs[$moduleName] ?? [];
                $activation = $this->activate($tenant, $moduleName, $config);
                $siteModule = $activation['siteModule'];

                $results['success'][] = [
                    'module' => $moduleName,
                    'installed_at' => $siteModule->installed_at->toIso8601String(),
                ];
            } catch (ModuleActivationException $e) {
                $results['failed'][] = [
                    'module' => $moduleName,
                    'error' => $e->getMessage(),
                ];
                // Continue avec les autres modules
            }
        }

        return new BatchResult($results);
    }

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
     * Désactive plusieurs modules pour un tenant
     */
    public function deactivateBatch(Tenant $tenant, array $moduleNames, array $options = []): BatchResult
    {
        // Résoudre l'ordre de désactivation (inverse des dépendances)
        $orderedModules = $this->resolveDeactivationOrder($moduleNames);

        $results = [
            'success' => [],
            'failed' => [],
            'skipped' => [],
        ];

        foreach ($orderedModules as $moduleName) {
            // Skip si déjà inactif
            if (!$this->moduleDiscovery->isModuleActiveForTenant($tenant->site_id, $moduleName)) {
                $results['skipped'][] = [
                    'module' => $moduleName,
                    'reason' => 'Already inactive',
                ];
                continue;
            }

            try {
                $siteModule = $this->deactivate($tenant, $moduleName, $options);

                $results['success'][] = [
                    'module' => $moduleName,
                    'deactivated_at' => $siteModule->uninstalled_at->toIso8601String(),
                ];
            } catch (ModuleDeactivationException $e) {
                $results['failed'][] = [
                    'module' => $moduleName,
                    'error' => $e->getMessage(),
                ];
                // Stop la boucle - on ne peut pas continuer sans risquer des incohérences
                break;
            }
        }

        return new BatchResult($results);
    }

    /**
     * Résout l'ordre d'activation des modules selon leurs dépendances
     */
    protected function resolveActivationOrder(array $moduleNames): array
    {
        $ordered = [];
        $resolved = [];

        foreach ($moduleNames as $moduleName) {
            $this->resolveDependencies($moduleName, $ordered, $resolved);
        }

        // Filtrer pour ne garder que les modules demandés
        return array_values(array_intersect($ordered, $moduleNames));
    }

    /**
     * Résout l'ordre de désactivation (inverse des dépendances)
     * Les dépendants doivent être désactivés avant les modules dont ils dépendent
     */
    protected function resolveDeactivationOrder(array $moduleNames): array
    {
        $ordered = [];

        foreach ($moduleNames as $module) {
            // Ajouter d'abord les modules qui dépendent de celui-ci
            $dependents = $this->dependencyResolver->getDependents($module);
            foreach ($dependents as $dep) {
                if (in_array($dep, $moduleNames) && !in_array($dep, $ordered)) {
                    $ordered[] = $dep;
                }
            }
            // Puis le module lui-même
            if (!in_array($module, $ordered)) {
                $ordered[] = $module;
            }
        }

        return $ordered;
    }

    /**
     * Résout récursivement les dépendances d'un module
     */
    protected function resolveDependencies(string $moduleName, array &$ordered, array &$resolved): void
    {
        if (in_array($moduleName, $resolved)) {
            return;
        }

        $resolved[] = $moduleName;

        // Obtenir les dépendances du module
        $dependencies = $this->dependencyResolver->getModuleDependencies($moduleName);

        foreach ($dependencies as $dependency) {
            if (!in_array($dependency, $resolved)) {
                $this->resolveDependencies($dependency, $ordered, $resolved);
            }
        }

        if (!in_array($moduleName, $ordered)) {
            $ordered[] = $moduleName;
        }
    }

    /**
     * Construit la saga d'activation
     */
    protected function buildActivationSaga(Tenant $tenant, string $moduleName, array $config): SagaOrchestrator
    {
        $saga = new SagaOrchestrator();

        return $saga
            ->addStep(
                'run_migrations',
                fn() => $this->migrationRunner->runModuleMigrations($tenant, $moduleName),
                fn() => $this->migrationRunner->rollbackModuleMigrations($tenant, $moduleName)
            )
            ->addStep(
                'create_s3_structure',
                fn() => $this->storageManager->createModuleStructure($tenant->site_id, $moduleName),
                fn() => $this->storageManager->deleteModuleStructure($tenant->site_id, $moduleName)
            )
            ->addStep(
                'generate_config',
                fn() => $this->storageManager->generateModuleConfig($tenant->site_id, $moduleName, $config),
                fn() => $this->storageManager->deleteModuleConfig($tenant->site_id, $moduleName)
            );
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

    /**
     * Crée ou réactive l'entrée dans t_site_modules
     */
    protected function createSiteModuleRecord(Tenant $tenant, string $moduleName, array $config): SiteModule
    {
        // Vérifier si le module existe déjà (potentiellement désactivé)
        $siteModule = SiteModule::forTenant($tenant->site_id)
            ->where('module_name', $moduleName)
            ->first();

        if ($siteModule) {
            // Réactiver le module existant
            $siteModule->update([
                'is_active' => 'YES',
                'installed_at' => now(),
                'uninstalled_at' => null,
                'config' => $config,
            ]);
            return $siteModule->fresh();
        }

        // Créer un nouveau module
        return SiteModule::create([
            'site_id' => $tenant->site_id,
            'module_name' => $moduleName,
            'is_active' => 'YES',
            'installed_at' => now(),
            'config' => $config,
        ]);
    }
}
