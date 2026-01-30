<?php

namespace Modules\Superadmin\Services;

use Modules\Superadmin\Exceptions\ModuleDependencyException;

class ModuleDependencyResolver implements ModuleDependencyResolverInterface
{
    public function __construct(
        private ModuleDiscoveryInterface $moduleDiscovery
    ) {}

    /**
     * Résout les dépendances et retourne l'ordre d'installation
     * Utilise l'algorithme de tri topologique
     *
     * @param string $moduleName
     * @return array Liste ordonnée des modules à installer
     * @throws ModuleDependencyException
     */
    public function resolve(string $moduleName): array
    {
        $modules = $this->moduleDiscovery->getAvailableModules()->keyBy('name');

        if (!$modules->has($moduleName)) {
            throw ModuleDependencyException::moduleNotFound($moduleName);
        }

        $resolved = [];
        $unresolved = [];

        $this->resolveDependencies($moduleName, $modules, $resolved, $unresolved);

        return $resolved;
    }

    /**
     * Récupère tous les modules qui dépendent d'un module donné
     *
     * @param string $moduleName
     * @return array Liste des modules dépendants
     */
    public function getDependents(string $moduleName): array
    {
        $modules = $this->moduleDiscovery->getAvailableModules();
        $dependents = [];

        foreach ($modules as $module) {
            $dependencies = $module['dependencies'] ?? [];
            if (in_array($moduleName, $dependencies)) {
                $dependents[] = $module['name'];
            }
        }

        return $dependents;
    }

    /**
     * Vérifie si un module peut être activé (dépendances satisfaites)
     *
     * @param string $moduleName
     * @param int $siteId
     * @return array ['can_activate' => bool, 'missing' => array, 'message' => string]
     */
    public function canActivate(string $moduleName, int $siteId): array
    {
        $modules = $this->moduleDiscovery->getAvailableModules()->keyBy('name');
        $module = $modules->get($moduleName);

        if (!$module) {
            return [
                'can_activate' => false,
                'missing' => [],
                'message' => "Module {$moduleName} not found",
            ];
        }

        $dependencies = $module['dependencies'] ?? [];
        $missing = [];

        foreach ($dependencies as $dep) {
            if (!$this->moduleDiscovery->isModuleActiveForTenant($siteId, $dep)) {
                $missing[] = $dep;
            }
        }

        return [
            'can_activate' => empty($missing),
            'missing' => $missing,
            'message' => empty($missing)
                ? 'All dependencies satisfied'
                : 'Missing dependencies: ' . implode(', ', $missing),
        ];
    }

    /**
     * Vérifie si un module peut être désactivé (pas de dépendants actifs)
     *
     * @param string $moduleName
     * @param int $siteId
     * @return array ['can_deactivate' => bool, 'blocking_modules' => array, 'message' => string]
     */
    public function canDeactivate(string $moduleName, int $siteId): array
    {
        $dependents = $this->getDependents($moduleName);
        $blocking = [];

        foreach ($dependents as $dep) {
            if ($this->moduleDiscovery->isModuleActiveForTenant($siteId, $dep)) {
                $blocking[] = $dep;
            }
        }

        return [
            'can_deactivate' => empty($blocking),
            'blocking_modules' => $blocking,
            'message' => empty($blocking)
                ? 'No blocking dependents'
                : 'Blocking modules: ' . implode(', ', $blocking),
        ];
    }

    /**
     * Récupère les dépendances directes d'un module
     *
     * @param string $moduleName
     * @return array Liste des dépendances directes
     */
    public function getModuleDependencies(string $moduleName): array
    {
        $modules = $this->moduleDiscovery->getAvailableModules()->keyBy('name');
        $module = $modules->get($moduleName);

        if (!$module) {
            return [];
        }

        return $module['dependencies'] ?? [];
    }

    /**
     * Résolution récursive avec détection de cycles
     * Implémente l'algorithme de tri topologique
     *
     * @param string $moduleName
     * @param \Illuminate\Support\Collection $modules
     * @param array $resolved
     * @param array $unresolved
     * @return void
     * @throws ModuleDependencyException
     */
    protected function resolveDependencies(
        string $moduleName,
        $modules,
        array &$resolved,
        array &$unresolved
    ): void {
        $unresolved[] = $moduleName;
        $module = $modules->get($moduleName);

        foreach ($module['dependencies'] ?? [] as $dep) {
            // Vérifier que la dépendance existe
            if (!$modules->has($dep)) {
                throw ModuleDependencyException::dependencyNotFound($moduleName, $dep);
            }

            // Détecter les cycles (dépendances circulaires)
            if (in_array($dep, $unresolved)) {
                throw ModuleDependencyException::circularDependency($moduleName, $dep);
            }

            // Résoudre récursivement si pas encore résolu
            if (!in_array($dep, $resolved)) {
                $this->resolveDependencies($dep, $modules, $resolved, $unresolved);
            }
        }

        $resolved[] = $moduleName;
        $unresolved = array_diff($unresolved, [$moduleName]);
    }
}
