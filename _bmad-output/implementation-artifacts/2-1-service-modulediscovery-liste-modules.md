# Story 2.1: Service ModuleDiscovery - Liste Modules Disponibles

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **lister tous les modules disponibles dans le système**,
so that **je peux voir quels modules peuvent être activés pour les tenants**.

---

## Acceptance Criteria

1. **Given** le système avec des modules installés (nwidart/laravel-modules)
   **When** j'appelle `ModuleDiscovery::getAvailableModules()`
   **Then** je reçois la liste de tous les modules avec leurs métadonnées

2. **Given** la liste des modules disponibles
   **When** je consulte les métadonnées d'un module
   **Then** j'ai accès au nom, version, description et dépendances

3. **Given** des modules activables et non-activables
   **When** je filtre avec `getActivatableModules()`
   **Then** seuls les modules pouvant être activés par tenant sont retournés (exclusion du module Superadmin, etc.)

---

## Tasks / Subtasks

- [x] **Task 1: Créer le service ModuleDiscovery** (AC: #1)
  - [x] Créer `Modules/Superadmin/Services/ModuleDiscovery.php`
  - [x] Implémenter `getAvailableModules(): Collection`
  - [x] Utiliser `Module::all()` de nwidart/laravel-modules

- [x] **Task 2: Extraire les métadonnées** (AC: #2)
  - [x] Parser les fichiers `module.json` de chaque module
  - [x] Extraire: name, alias, description, version, dependencies
  - [x] Retourner un DTO ou array structuré

- [x] **Task 3: Filtrer les modules activables** (AC: #3)
  - [x] Implémenter `getActivatableModules(): Collection`
  - [x] Exclure les modules système (Superadmin, UsersGuard, etc.)
  - [x] Configurer la liste des exclusions

- [x] **Task 4: Créer l'interface** (AC: #1-3)
  - [x] Créer `Modules/Superadmin/Services/ModuleDiscoveryInterface.php`
  - [x] Bind dans le ServiceProvider

---

## Dev Notes

### Emplacement

`Modules/Superadmin/Services/ModuleDiscovery.php`

### Code de Référence

```php
<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Collection;
use Nwidart\Modules\Facades\Module;

class ModuleDiscovery implements ModuleDiscoveryInterface
{
    /**
     * Modules système qui ne peuvent pas être activés/désactivés par tenant
     */
    protected array $systemModules = [
        'Superadmin',
        'UsersGuard',
        'Site',
    ];

    /**
     * Retourne tous les modules disponibles avec métadonnées
     */
    public function getAvailableModules(): Collection
    {
        return collect(Module::all())->map(function ($module) {
            return $this->extractModuleMetadata($module);
        });
    }

    /**
     * Retourne uniquement les modules activables par tenant
     */
    public function getActivatableModules(): Collection
    {
        return $this->getAvailableModules()
            ->filter(fn ($module) => !in_array($module['name'], $this->systemModules));
    }

    /**
     * Retourne les noms des modules activables
     */
    public function getActivatableModuleNames(): array
    {
        return $this->getActivatableModules()
            ->pluck('name')
            ->toArray();
    }

    /**
     * Vérifie si un module est activable
     */
    public function isActivatable(string $moduleName): bool
    {
        return in_array($moduleName, $this->getActivatableModuleNames());
    }

    /**
     * Extrait les métadonnées d'un module
     */
    protected function extractModuleMetadata($module): array
    {
        $json = $module->json();

        return [
            'name' => $module->getName(),
            'alias' => $json->get('alias'),
            'description' => $json->get('description', ''),
            'version' => $json->get('version', '1.0.0'),
            'dependencies' => $json->get('dependencies', []),
            'priority' => $json->get('priority', 0),
            'is_system' => in_array($module->getName(), $this->systemModules),
            'path' => $module->getPath(),
            'enabled' => $module->isEnabled(),
        ];
    }
}
```

### Interface

```php
<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Collection;

interface ModuleDiscoveryInterface
{
    public function getAvailableModules(): Collection;
    public function getActivatableModules(): Collection;
    public function getActivatableModuleNames(): array;
    public function isActivatable(string $moduleName): bool;
}
```

### Binding dans ServiceProvider

```php
// Dans SuperadminServiceProvider::register()
$this->app->bind(
    ModuleDiscoveryInterface::class,
    ModuleDiscovery::class
);
```

### Modules Existants dans le Projet

Basé sur l'exploration du projet:
- UsersGuard
- User
- Dashboard
- Customer
- CustomersContracts
- Site

### Format de Sortie Attendu

```php
[
    [
        'name' => 'Customer',
        'alias' => 'customer',
        'description' => 'Customer management module',
        'version' => '1.0.0',
        'dependencies' => [],
        'priority' => 0,
        'is_system' => false,
        'path' => '/path/to/Modules/Customer',
        'enabled' => true,
    ],
    // ...
]
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR1, FR2]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

Aucune difficulté rencontrée pendant l'implémentation.

### Completion Notes List

✅ **Service ModuleDiscovery implémenté avec succès** (2026-01-28)
- Interface `ModuleDiscoveryInterface` créée avec 4 méthodes publiques
- Service `ModuleDiscovery` implémentant toutes les méthodes de l'interface
- Utilisation de `Nwidart\Modules\Facades\Module` pour accéder aux modules Laravel
- Extraction complète des métadonnées (9 champs): name, alias, description, version, dependencies, priority, is_system, path, enabled
- Filtrage des modules système: Superadmin, UsersGuard, Site
- Binding configuré dans `SuperadminServiceProvider`

✅ **Tests unitaires complets** (7 tests, 27 assertions)
- Test AC #1: getAvailableModules() retourne une Collection avec métadonnées
- Test AC #2: Métadonnées contiennent tous les champs requis
- Test AC #3: getActivatableModules() exclut les modules système
- Tests additionnels: getActivatableModuleNames(), isActivatable(), flag is_system
- Configuration phpunit.xml mise à jour pour inclure les tests des modules
- **Tous les tests passent sans régression**

### File List

- Modules/Superadmin/Services/ModuleDiscoveryInterface.php
- Modules/Superadmin/Services/ModuleDiscovery.php
- Modules/Superadmin/Providers/SuperadminServiceProvider.php
- Modules/Superadmin/Tests/Unit/ModuleDiscoveryTest.php
- phpunit.xml

---

## Change Log

### 2026-01-28 - Story Implémenté
- Création du service ModuleDiscovery avec interface
- Implémentation des 4 méthodes: getAvailableModules(), getActivatableModules(), getActivatableModuleNames(), isActivatable()
- Extraction des métadonnées de modules (9 champs)
- Filtrage des modules système configuré
- Binding du service dans le container Laravel
- Tests unitaires complets (7 tests, 27 assertions, 100% pass)
- Configuration phpunit.xml pour supporter les tests de modules
- **Status:** ready-for-dev → review

