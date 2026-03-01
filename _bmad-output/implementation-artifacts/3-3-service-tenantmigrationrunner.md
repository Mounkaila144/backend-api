# Story 3.3: Service TenantMigrationRunner

**Status:** review

---

## Story

As a **développeur**,
I want **exécuter les migrations d'un module dans la base de données d'un tenant**,
so that **les tables du module sont créées pour ce tenant**.

---

## Acceptance Criteria

1. **Given** un tenant et un module
   **When** j'appelle `runModuleMigrations($tenant, $module)`
   **Then** les migrations du module sont exécutées dans la BDD du tenant

2. **Given** des migrations déjà exécutées
   **When** j'essaie de les réexécuter
   **Then** elles sont ignorées (idempotent)

3. **Given** une migration qui échoue
   **When** l'erreur se produit
   **Then** une exception est levée avec les détails

---

## Tasks / Subtasks

- [x] **Task 1: Créer TenantMigrationRunner** (AC: #1)
  - [x] Créer `Modules/Superadmin/Services/TenantMigrationRunner.php`
  - [x] Utiliser `tenancy()->run()` pour switcher le contexte
  - [x] Exécuter les migrations du module spécifique

- [x] **Task 2: Gérer l'idempotence** (AC: #2)
  - [x] Vérifier quelles migrations sont déjà exécutées
  - [x] Ne pas réexécuter les migrations existantes

- [x] **Task 3: Gérer les erreurs** (AC: #3)
  - [x] Créer `MigrationException`
  - [x] Capturer et wrapper les erreurs

---

## Dev Notes

### TenantMigrationRunner

```php
<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Facades\Artisan;
use App\Models\Tenant;
use Modules\Superadmin\Exceptions\MigrationException;

class TenantMigrationRunner implements TenantMigrationRunnerInterface
{
    /**
     * Exécute les migrations d'un module pour un tenant
     */
    public function runModuleMigrations(Tenant $tenant, string $moduleName): array
    {
        $migrationPath = $this->getModuleMigrationPath($moduleName);

        if (!is_dir($migrationPath)) {
            // Pas de migrations pour ce module
            return ['status' => 'no_migrations', 'count' => 0];
        }

        try {
            $output = '';

            tenancy()->initialize($tenant);

            Artisan::call('migrate', [
                '--path' => $this->getRelativeMigrationPath($moduleName),
                '--force' => true,
            ]);

            $output = Artisan::output();

            tenancy()->end();

            return [
                'status' => 'success',
                'output' => $output,
                'count' => $this->countMigrations($migrationPath),
            ];
        } catch (\Exception $e) {
            tenancy()->end();
            throw MigrationException::runFailed($moduleName, $tenant->site_id, $e->getMessage());
        }
    }

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

    /**
     * Vérifie si les migrations d'un module sont exécutées pour un tenant
     */
    public function areMigrationsRun(Tenant $tenant, string $moduleName): bool
    {
        $migrationPath = $this->getModuleMigrationPath($moduleName);

        if (!is_dir($migrationPath)) {
            return true; // Pas de migrations = "exécutées"
        }

        try {
            tenancy()->initialize($tenant);

            Artisan::call('migrate:status', [
                '--path' => $this->getRelativeMigrationPath($moduleName),
            ]);

            $output = Artisan::output();

            tenancy()->end();

            // Si aucune migration en attente, retourne true
            return !str_contains($output, 'Pending');
        } catch (\Exception $e) {
            tenancy()->end();
            return false;
        }
    }

    /**
     * Retourne le chemin absolu des migrations d'un module
     */
    protected function getModuleMigrationPath(string $moduleName): string
    {
        return base_path("Modules/{$moduleName}/Database/Migrations");
    }

    /**
     * Retourne le chemin relatif pour Artisan
     */
    protected function getRelativeMigrationPath(string $moduleName): string
    {
        return "Modules/{$moduleName}/Database/Migrations";
    }

    /**
     * Compte le nombre de fichiers de migration
     */
    protected function countMigrations(string $path): int
    {
        $files = glob($path . '/*.php');
        return count($files);
    }
}
```

### MigrationException

```php
<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class MigrationException extends Exception
{
    public static function runFailed(string $module, int $tenantId, string $reason): self
    {
        return new self("Failed to run migrations for module '{$module}' on tenant {$tenantId}: {$reason}");
    }

    public static function rollbackFailed(string $module, int $tenantId, string $reason): self
    {
        return new self("Failed to rollback migrations for module '{$module}' on tenant {$tenantId}: {$reason}");
    }
}
```

### Utilisation de stancl/tenancy

Le projet utilise `stancl/tenancy`. Les méthodes clés:

```php
// Initialiser le contexte tenant
tenancy()->initialize($tenant);

// Terminer le contexte
tenancy()->end();

// Alternative avec callback
tenancy()->run($tenant, function () {
    // Code exécuté dans le contexte du tenant
});
```

### Interface

```php
interface TenantMigrationRunnerInterface
{
    public function runModuleMigrations(Tenant $tenant, string $moduleName): array;
    public function rollbackModuleMigrations(Tenant $tenant, string $moduleName): array;
    public function areMigrationsRun(Tenant $tenant, string $moduleName): bool;
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Module-Lifecycle]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
Aucune erreur rencontrée durant l'implémentation.

### Completion Notes List
✅ **Story 3-3 complétée** (2026-01-28)
- Créé TenantMigrationRunnerInterface avec 3 méthodes : runModuleMigrations(), rollbackModuleMigrations(), areMigrationsRun()
- Implémenté TenantMigrationRunner avec gestion du contexte tenant via tenancy()->initialize() / tenancy()->end()
- Exécution des migrations via Artisan::call('migrate') avec --path pour cibler un module spécifique
- Gestion de l'idempotence : Laravel gère automatiquement les migrations déjà exécutées (table migrations)
- Méthode areMigrationsRun() vérifie via migrate:status si des migrations sont en attente
- Créé MigrationException avec méthodes statiques pour erreurs d'exécution et rollback
- Enregistré TenantMigrationRunner dans SuperadminServiceProvider pour injection de dépendances
- Tous les critères d'acceptation satisfaits (#1, #2, #3)

### File List
- Modules/Superadmin/Services/TenantMigrationRunnerInterface.php (nouveau)
- Modules/Superadmin/Services/TenantMigrationRunner.php (nouveau)
- Modules/Superadmin/Exceptions/MigrationException.php (nouveau)
- Modules/Superadmin/Providers/SuperadminServiceProvider.php (modifié - ajout binding)

## Change Log
- 2026-01-28: Création du service TenantMigrationRunner pour l'exécution de migrations module dans le contexte tenant

