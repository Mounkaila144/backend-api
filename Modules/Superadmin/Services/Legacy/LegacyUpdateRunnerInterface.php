<?php

namespace Modules\Superadmin\Services\Legacy;

use App\Models\Tenant;

/**
 * Interface pour l'exécution des mises à jour legacy
 */
interface LegacyUpdateRunnerInterface
{
    /**
     * Installe un module pour un tenant (schema.sql + toutes les versions)
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @return array Rapport d'installation
     */
    public function install(Tenant $tenant, string $moduleName): array;

    /**
     * Désinstalle un module pour un tenant (downgrade de toutes les versions + drop.sql)
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @return array Rapport de désinstallation
     */
    public function uninstall(Tenant $tenant, string $moduleName): array;

    /**
     * Met à jour un module vers une version spécifique
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @param string $fromVersion Version actuelle
     * @param string|null $toVersion Version cible (null = dernière)
     * @return array Rapport de mise à jour
     */
    public function upgrade(Tenant $tenant, string $moduleName, string $fromVersion, ?string $toVersion = null): array;

    /**
     * Rétrograde un module vers une version antérieure
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @param string $fromVersion Version actuelle
     * @param string $toVersion Version cible
     * @return array Rapport de rétrogradation
     */
    public function downgrade(Tenant $tenant, string $moduleName, string $fromVersion, string $toVersion): array;

    /**
     * Exécute le schema.sql d'un module
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @return array Résultat de l'exécution
     */
    public function runSchema(Tenant $tenant, string $moduleName): array;

    /**
     * Exécute le drop.sql d'un module
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @return array Résultat de l'exécution
     */
    public function runDrop(Tenant $tenant, string $moduleName): array;

    /**
     * Exécute une version spécifique (upgrade)
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @param string $version
     * @return array Résultat de l'exécution
     */
    public function runVersionUpgrade(Tenant $tenant, string $moduleName, string $version): array;

    /**
     * Exécute une version spécifique (downgrade)
     *
     * @param Tenant $tenant
     * @param string $moduleName
     * @param string $version
     * @return array Résultat de l'exécution
     */
    public function runVersionDowngrade(Tenant $tenant, string $moduleName, string $version): array;

    /**
     * Vérifie si un module a des mises à jour legacy disponibles
     *
     * @param string $moduleName
     * @return bool
     */
    public function hasLegacyUpdates(string $moduleName): bool;

    /**
     * Retourne la dernière version disponible pour un module
     *
     * @param string $moduleName
     * @return string|null
     */
    public function getLatestVersion(string $moduleName): ?string;
}
