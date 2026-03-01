# Story 2.3: Service ModuleDiscovery - Modules par Tenant

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **voir les modules activés pour un tenant spécifique**,
so that **je sais quels modules sont disponibles pour ce tenant**.

---

## Acceptance Criteria

1. **Given** un tenant avec des modules activés
   **When** j'appelle `ModuleDiscovery::getModulesForTenant($siteId)`
   **Then** je reçois la liste des modules avec leur statut (actif/inactif)

2. **Given** la liste des modules pour un tenant
   **When** je consulte le statut
   **Then** je vois la date d'installation et la configuration de chaque module

3. **Given** un tenant sans modules activés
   **When** j'appelle la méthode
   **Then** je reçois une liste vide

---

## Tasks / Subtasks

- [x] **Task 1: Étendre ModuleDiscovery** (AC: #1)
  - [x] Ajouter `getModulesForTenant(int $siteId): Collection`
  - [x] Joindre les données de t_site_modules avec les métadonnées

- [x] **Task 2: Inclure les statuts** (AC: #2)
  - [x] Ajouter le statut (actif/inactif) de chaque module
  - [x] Inclure les dates d'installation/désinstallation
  - [x] Inclure la configuration spécifique au tenant

- [x] **Task 3: Créer une méthode de comparaison** (AC: #1, #3)
  - [x] Implémenter `getAvailableModulesWithStatus(int $siteId)`
  - [x] Merger les modules disponibles avec le statut tenant

- [x] **Task 4: Optimiser les queries** (AC: #1-3)
  - [x] Utiliser eager loading avec keyBy() pour éviter N+1
  - [x] Single query pour récupérer tous les modules tenant

---

## Dev Notes

### Méthodes à Ajouter à ModuleDiscovery

```php
<?php

// Dans ModuleDiscovery.php

/**
 * Récupère les modules activés pour un tenant
 */
public function getModulesForTenant(int $siteId): Collection
{
    return SiteModule::forTenant($siteId)
        ->active()
        ->get()
        ->map(fn ($sm) => $this->enrichWithMetadata($sm));
}

/**
 * Récupère tous les modules disponibles avec le statut pour ce tenant
 */
public function getAvailableModulesWithStatus(int $siteId): Collection
{
    $tenantModules = SiteModule::forTenant($siteId)
        ->get()
        ->keyBy('module_name');

    return $this->getActivatableModules()->map(function ($module) use ($tenantModules) {
        $tenantModule = $tenantModules->get($module['name']);

        return array_merge($module, [
            'tenant_status' => $tenantModule ? [
                'is_active' => $tenantModule->isActive(),
                'installed_at' => $tenantModule->installed_at?->toIso8601String(),
                'uninstalled_at' => $tenantModule->uninstalled_at?->toIso8601String(),
                'config' => $tenantModule->config,
            ] : null,
        ]);
    });
}

/**
 * Enrichit un SiteModule avec les métadonnées du module
 */
protected function enrichWithMetadata(SiteModule $siteModule): array
{
    $module = Module::find($siteModule->module_name);
    $metadata = $module ? $this->extractModuleMetadata($module) : [];

    return array_merge($metadata, [
        'tenant_status' => [
            'is_active' => $siteModule->isActive(),
            'installed_at' => $siteModule->installed_at?->toIso8601String(),
            'uninstalled_at' => $siteModule->uninstalled_at?->toIso8601String(),
            'config' => $siteModule->config,
        ],
    ]);
}

/**
 * Vérifie si un module est actif pour un tenant
 */
public function isModuleActiveForTenant(int $siteId, string $moduleName): bool
{
    return SiteModule::forTenant($siteId)
        ->where('module_name', $moduleName)
        ->active()
        ->exists();
}
```

### Format de Sortie

```php
[
    [
        'name' => 'Customer',
        'alias' => 'customer',
        'description' => 'Customer management',
        'version' => '1.0.0',
        'dependencies' => [],
        'is_system' => false,
        'tenant_status' => [
            'is_active' => true,
            'installed_at' => '2026-01-15T10:30:00+00:00',
            'uninstalled_at' => null,
            'config' => ['setting1' => 'value1'],
        ],
    ],
    [
        'name' => 'CustomersContracts',
        // ... module non activé pour ce tenant
        'tenant_status' => null,
    ],
]
```

### Interface Étendue

```php
interface ModuleDiscoveryInterface
{
    // ... méthodes existantes ...
    public function getModulesForTenant(int $siteId): Collection;
    public function getAvailableModulesWithStatus(int $siteId): Collection;
    public function isModuleActiveForTenant(int $siteId, string $moduleName): bool;
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR3, FR4]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

Aucune difficulté rencontrée. Le modèle SiteModule existait déjà avec tous les scopes nécessaires.

### Completion Notes List

✅ **Service ModuleDiscovery étendu avec succès** (2026-01-28)
- 3 nouvelles méthodes publiques ajoutées à l'interface
- `getModulesForTenant(int $siteId)` - Retourne modules actifs d'un tenant
- `getAvailableModulesWithStatus(int $siteId)` - Merge modules disponibles + statuts tenant
- `isModuleActiveForTenant(int $siteId, string $moduleName)` - Vérifie activation module

✅ **Enrichissement des données**
- Méthode `enrichWithMetadata()` créée pour combiner métadonnées module + statut tenant
- Inclut: is_active, installed_at, uninstalled_at, config JSON
- Format ISO8601 pour les dates (toIso8601String())

✅ **Optimisation des queries**
- Utilisation de `keyBy('module_name')` pour éviter N+1
- Single query pour charger tous les modules tenant
- Merge efficace avec les métadonnées des modules disponibles

✅ **Tests unitaires créés** (5 tests ajoutés, non exécutés comme demandé)
- Test AC #1: getModulesForTenant retourne modules actifs
- Test AC #2: getAvailableModulesWithStatus inclut statuts et dates
- Test AC #3: Tenant sans modules retourne liste vide
- Tests additionnels: isModuleActiveForTenant true/false

✅ **Total tests ModuleDiscovery: 12 tests** (7 du story 2-1 + 5 du story 2-3)

### File List

- Modules/Superadmin/Services/ModuleDiscoveryInterface.php
- Modules/Superadmin/Services/ModuleDiscovery.php
- Modules/Superadmin/Tests/Unit/ModuleDiscoveryTest.php

---

## Change Log

### 2026-01-28 - Extension Service pour Tenant Status
- Ajout de 3 méthodes publiques au service ModuleDiscovery
- Interface ModuleDiscoveryInterface étendue
- Méthode enrichWithMetadata() pour combiner métadonnées + statut
- Optimisation queries avec keyBy() pour éviter N+1
- 5 tests unitaires ajoutés (12 tests au total pour le service)
- **Status:** ready-for-dev → review

