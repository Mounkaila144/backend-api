<?php

namespace Modules\Superadmin\Services;

use App\Models\Tenant;

interface TenantMigrationRunnerInterface
{
    /**
     * Exécute les migrations d'un module pour un tenant
     */
    public function runModuleMigrations(Tenant $tenant, string $moduleName): array;

    /**
     * Rollback les migrations d'un module pour un tenant
     */
    public function rollbackModuleMigrations(Tenant $tenant, string $moduleName): array;

    /**
     * Vérifie si les migrations d'un module sont exécutées pour un tenant
     */
    public function areMigrationsRun(Tenant $tenant, string $moduleName): bool;

    /**
     * Vérifie si les migrations d'un module peuvent être rollback
     */
    public function canRollback(Tenant $tenant, string $moduleName): array;

    /**
     * Vérifie que les tables d'un module ont été supprimées après rollback
     */
    public function verifyTablesDeleted(Tenant $tenant, string $moduleName, array $expectedTables): array;
}
