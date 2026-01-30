<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use Modules\Superadmin\Exceptions\MigrationException;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

class TenantMigrationRunner implements TenantMigrationRunnerInterface
{
    use LogsSuperadminActivity;
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
            $this->logInfo('No migrations to rollback', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
            ]);
            return ['status' => 'no_migrations', 'count' => 0];
        }

        try {
            tenancy()->initialize($tenant);

            $this->logInfo('Starting migration rollback', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
                'migration_path' => $migrationPath,
            ]);

            // Rollback toutes les migrations du module
            Artisan::call('migrate:rollback', [
                '--path' => $this->getRelativeMigrationPath($moduleName),
                '--force' => true,
            ]);

            $output = Artisan::output();

            tenancy()->end();

            $this->logInfo('Migration rollback completed', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
                'output' => $output,
            ]);

            return [
                'status' => 'success',
                'output' => $output,
            ];
        } catch (\Exception $e) {
            tenancy()->end();

            $this->logError('Migration rollback failed', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
                'error' => $e->getMessage(),
            ]);

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

    /**
     * Vérifie si les migrations d'un module peuvent être rollback
     * Note: Pour l'instant, on fait confiance au système de dépendances modules
     */
    public function canRollback(Tenant $tenant, string $moduleName): array
    {
        try {
            tenancy()->initialize($tenant);

            // Vérifier si le module a des migrations exécutées
            $migrationsRun = $this->areMigrationsRun($tenant, $moduleName);

            tenancy()->end();

            return [
                'can_rollback' => $migrationsRun,
                'blocking_tables' => [],
                'message' => $migrationsRun ? 'Module can be rolled back' : 'No migrations to rollback',
            ];
        } catch (\Exception $e) {
            tenancy()->end();

            $this->logError('Rollback verification failed', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
                'error' => $e->getMessage(),
            ]);

            return [
                'can_rollback' => false,
                'blocking_tables' => [],
                'message' => 'Error checking rollback status: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Vérifie que les tables d'un module ont été supprimées après rollback
     */
    public function verifyTablesDeleted(Tenant $tenant, string $moduleName, array $expectedTables): array
    {
        try {
            tenancy()->initialize($tenant);

            $existingTables = [];
            $allTables = DB::select('SHOW TABLES');
            $databaseName = DB::getDatabaseName();
            $tableColumn = "Tables_in_{$databaseName}";

            foreach ($allTables as $table) {
                $tableName = $table->$tableColumn;
                if (in_array($tableName, $expectedTables)) {
                    $existingTables[] = $tableName;
                }
            }

            tenancy()->end();

            $allDeleted = empty($existingTables);

            if ($allDeleted) {
                $this->logInfo('Tables verification passed - all tables deleted', [
                    'tenant_id' => $tenant->site_id,
                    'module' => $moduleName,
                    'expected_tables' => $expectedTables,
                ]);
            } else {
                $this->logWarning('Tables verification failed - some tables still exist', [
                    'tenant_id' => $tenant->site_id,
                    'module' => $moduleName,
                    'expected_deleted' => $expectedTables,
                    'still_existing' => $existingTables,
                ]);
            }

            return [
                'all_deleted' => $allDeleted,
                'existing_tables' => $existingTables,
                'message' => $allDeleted
                    ? 'All tables successfully deleted'
                    : 'Some tables still exist: ' . implode(', ', $existingTables),
            ];
        } catch (\Exception $e) {
            tenancy()->end();

            $this->logError('Table verification failed', [
                'tenant_id' => $tenant->site_id,
                'module' => $moduleName,
                'error' => $e->getMessage(),
            ]);

            return [
                'all_deleted' => false,
                'existing_tables' => [],
                'message' => 'Verification error: ' . $e->getMessage(),
            ];
        }
    }
}
