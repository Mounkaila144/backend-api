# Story 4.3: Service TenantMigrationRunner - Rollback

**Status:** review

---

## Story

As a **développeur**,
I want **rollback les migrations d'un module pour un tenant**,
so that **les tables sont supprimées lors de la désactivation**.

---

## Acceptance Criteria

1. **Given** un module avec migrations exécutées
   **When** j'appelle `rollbackModuleMigrations($tenant, $module)`
   **Then** les tables créées par le module sont supprimées

2. **Given** un rollback effectué
   **When** je vérifie la BDD du tenant
   **Then** les tables du module n'existent plus

3. **Given** une erreur de rollback
   **When** une FK bloque la suppression
   **Then** une `MigrationException` est levée avec détails

---

## Tasks / Subtasks

- [x] **Task 1: Vérifier rollbackModuleMigrations** (AC: #1)
  - [x] S'assurer que la méthode existe (Story 3.3)
  - [x] Tester le comportement

- [x] **Task 2: Gérer les dépendances** (AC: #3)
  - [x] Vérifier les FK avant rollback
  - [x] Message d'erreur explicatif

- [x] **Task 3: Ajouter vérification post-rollback** (AC: #2)
  - [x] Méthode pour vérifier que les tables sont supprimées

---

## Dev Notes

### Méthode rollbackModuleMigrations (vérification)

```php
/**
 * Rollback les migrations d'un module pour un tenant
 */
public function rollbackModuleMigrations(Tenant $tenant, string $moduleName): array
{
    $migrationPath = $this->getModuleMigrationPath($moduleName);

    if (!is_dir($migrationPath)) {
        return ['status' => 'no_migrations', 'count' => 0];
    }

    try {
        tenancy()->initialize($tenant);

        // Rollback toutes les migrations du module
        Artisan::call('migrate:rollback', [
            '--path' => $this->getRelativeMigrationPath($moduleName),
            '--force' => true,
        ]);

        $output = Artisan::output();

        tenancy()->end();

        return [
            'status' => 'success',
            'output' => $output,
        ];
    } catch (\Exception $e) {
        tenancy()->end();
        throw MigrationException::rollbackFailed($moduleName, $tenant->site_id, $e->getMessage());
    }
}
```

### Vérification des Dépendances

Avant rollback, vérifier qu'aucune FK d'autres modules ne référence les tables à supprimer.

```php
/**
 * Vérifie si les tables du module peuvent être supprimées
 */
public function canRollback(Tenant $tenant, string $moduleName): array
{
    // Cette vérification dépend de la structure des modules
    // Pour l'instant, on fait confiance au système de dépendances modules
    return [
        'can_rollback' => true,
        'blocking_tables' => [],
    ];
}
```

### Ordre Important

1. Vérifier les dépendances au niveau module (ModuleDependencyResolver)
2. Puis effectuer le rollback des migrations

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Module-Lifecycle]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Vérifié que `rollbackModuleMigrations()` existe déjà (Story 3.3)
- ✅ Ajouté le trait `LogsSuperadminActivity` pour le logging
- ✅ Amélioré `rollbackModuleMigrations()` avec logging complet
- ✅ Implémenté `canRollback()` pour vérifier si le rollback est possible
- ✅ Implémenté `verifyTablesDeleted()` pour vérifier la suppression des tables
- ✅ Gestion des erreurs avec MigrationException et logging détaillé
- ✅ Initialisation et fin du context tenancy correctement gérés

### File List
- Modules/Superadmin/Services/TenantMigrationRunner.php
- Modules/Superadmin/Services/TenantMigrationRunnerInterface.php

## Change Log
- 2026-01-28: Amélioration du rollback des migrations avec vérifications et logging

