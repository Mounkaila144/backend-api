# Story 2.6: Service ModuleDependencyResolver

**Status:** review

---

## Story

As a **développeur**,
I want **un service pour résoudre les dépendances entre modules**,
so that **les activations respectent l'ordre des dépendances**.

---

## Acceptance Criteria

1. **Given** un module avec des dépendances
   **When** j'appelle `resolve($moduleName)`
   **Then** je reçois la liste ordonnée des modules à installer

2. **Given** un module
   **When** j'appelle `getDependents($moduleName)`
   **Then** je reçois la liste des modules qui dépendent de lui

3. **Given** des dépendances circulaires
   **When** j'essaie de résoudre
   **Then** une exception est levée avec un message explicatif

4. **Given** une dépendance manquante
   **When** j'essaie de résoudre
   **Then** une exception est levée listant les dépendances manquantes

---

## Tasks / Subtasks

- [x] **Task 1: Créer le service** (AC: #1)
  - [x] Créer `Modules/Superadmin/Services/ModuleDependencyResolver.php`
  - [x] Implémenter `resolve(string $moduleName): array`
  - [x] Utiliser l'algorithme de tri topologique

- [x] **Task 2: Implémenter getDependents** (AC: #2)
  - [x] Implémenter `getDependents(string $moduleName): array`
  - [x] Parcourir tous les modules pour trouver les dépendants

- [x] **Task 3: Gérer les erreurs** (AC: #3, #4)
  - [x] Créer `ModuleDependencyException`
  - [x] Détecter les cycles
  - [x] Détecter les dépendances manquantes

- [x] **Task 4: Créer l'interface** (AC: #1-4)
  - [x] Créer `ModuleDependencyResolverInterface`
  - [x] Bind dans le ServiceProvider

---

## Dev Notes

### Emplacement

`Modules/Superadmin/Services/ModuleDependencyResolver.php`

### Code de Référence

```php
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
     */
    public function canActivate(string $moduleName, int $siteId): array
    {
        $modules = $this->moduleDiscovery->getAvailableModules()->keyBy('name');
        $module = $modules->get($moduleName);

        if (!$module) {
            return ['can_activate' => false, 'missing' => [], 'message' => "Module {$moduleName} not found"];
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
     * Résolution récursive avec détection de cycles
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
            if (!$modules->has($dep)) {
                throw ModuleDependencyException::dependencyNotFound($moduleName, $dep);
            }

            if (in_array($dep, $unresolved)) {
                throw ModuleDependencyException::circularDependency($moduleName, $dep);
            }

            if (!in_array($dep, $resolved)) {
                $this->resolveDependencies($dep, $modules, $resolved, $unresolved);
            }
        }

        $resolved[] = $moduleName;
        $unresolved = array_diff($unresolved, [$moduleName]);
    }
}
```

### Exception Personnalisée

```php
<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class ModuleDependencyException extends Exception
{
    public static function moduleNotFound(string $module): self
    {
        return new self("Module '{$module}' not found");
    }

    public static function dependencyNotFound(string $module, string $dependency): self
    {
        return new self("Module '{$module}' requires '{$dependency}' which was not found");
    }

    public static function circularDependency(string $module, string $dependency): self
    {
        return new self("Circular dependency detected: '{$module}' <-> '{$dependency}'");
    }

    public static function missingDependencies(string $module, array $missing): self
    {
        return new self("Module '{$module}' requires: " . implode(', ', $missing));
    }
}
```

### Interface

```php
<?php

namespace Modules\Superadmin\Services;

interface ModuleDependencyResolverInterface
{
    public function resolve(string $moduleName): array;
    public function getDependents(string $moduleName): array;
    public function canActivate(string $moduleName, int $siteId): array;
    public function canDeactivate(string $moduleName, int $siteId): array;
}
```

### Exemple d'Utilisation

```php
// Résoudre les dépendances pour installation
$resolver->resolve('CustomersContracts');
// Retourne: ['Customer', 'CustomersContracts']

// Vérifier si un module peut être activé
$result = $resolver->canActivate('CustomersContracts', $siteId);
// Retourne: ['can_activate' => false, 'missing' => ['Customer'], ...]

// Trouver les modules qui dépendent de Customer
$resolver->getDependents('Customer');
// Retourne: ['CustomersContracts']
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR35-FR38]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.6]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Créé ModuleDependencyResolverInterface avec 4 méthodes (resolve, getDependents, canActivate, canDeactivate)
- ✅ Implémenté ModuleDependencyResolver avec algorithme de tri topologique pour résolution de dépendances
- ✅ Ajouté détection de cycles (dépendances circulaires) dans resolveDependencies()
- ✅ Ajouté détection de dépendances manquantes avec exceptions claires
- ✅ Créé ModuleDependencyException avec 4 factory methods statiques pour différents types d'erreurs
- ✅ Bindé l'interface dans SuperadminServiceProvider pour injection de dépendances
- ✅ Implémenté méthodes utilitaires canActivate() et canDeactivate() pour validation pré-activation/désactivation

### File List
- Modules/Superadmin/Services/ModuleDependencyResolverInterface.php (créé)
- Modules/Superadmin/Services/ModuleDependencyResolver.php (créé)
- Modules/Superadmin/Exceptions/ModuleDependencyException.php (créé)
- Modules/Superadmin/Providers/SuperadminServiceProvider.php (modifié)

### Change Log
- 2026-01-28: Implémentation complète du service de résolution de dépendances entre modules avec tri topologique, détection de cycles et validation pré-activation

