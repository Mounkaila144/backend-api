<?php

namespace Modules\Superadmin\Services\Legacy;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

/**
 * Service de découverte des mises à jour legacy
 *
 * Ce service explore la structure des modules pour trouver :
 * - Database/models/schema.sql (installation initiale)
 * - Database/models/drop.sql (désinstallation)
 * - Database/updates/{version}/actions/upgradeAction.class.php
 * - Database/updates/{version}/actions/downgradeAction.class.php
 * - Database/updates/{version}/models/upgrade.sql
 * - Database/updates/{version}/models/downgrade.sql
 */
class LegacyUpdateDiscovery implements LegacyUpdateDiscoveryInterface
{
    use LogsSuperadminActivity;

    /**
     * Cache des versions découvertes par module
     */
    protected array $versionCache = [];

    /**
     * {@inheritdoc}
     */
    public function hasLegacyStructure(string $moduleName): bool
    {
        $basePath = $this->getModuleBasePath($moduleName);

        // Vérifier si le dossier Database existe
        if (!is_dir($basePath)) {
            return false;
        }

        // Un module a une structure legacy s'il a schema.sql OU un dossier updates/
        return $this->hasSchemaFile($moduleName)
            || $this->hasDropFile($moduleName)
            || is_dir("{$basePath}/updates");
    }

    /**
     * {@inheritdoc}
     */
    public function getAvailableVersions(string $moduleName): array
    {
        if (isset($this->versionCache[$moduleName])) {
            return $this->versionCache[$moduleName];
        }

        $updatesPath = $this->getModuleBasePath($moduleName) . '/updates';

        if (!is_dir($updatesPath)) {
            $this->versionCache[$moduleName] = [];
            return [];
        }

        $versions = [];
        $directories = File::directories($updatesPath);

        foreach ($directories as $directory) {
            $versionName = basename($directory);

            // Valider que c'est un nom de version valide (ex: 1.0, 1.1, 2.0, etc.)
            if ($this->isValidVersionName($versionName)) {
                $versions[] = $versionName;
            }
        }

        // Trier les versions par ordre numérique
        usort($versions, function ($a, $b) {
            return version_compare($a, $b);
        });

        $this->versionCache[$moduleName] = $versions;

        $this->logInfo('Discovered legacy versions', [
            'module' => $moduleName,
            'versions' => $versions,
            'count' => count($versions),
        ]);

        return $versions;
    }

    /**
     * {@inheritdoc}
     */
    public function getVersionsToApply(string $moduleName, ?string $fromVersion = null, ?string $toVersion = null): array
    {
        $allVersions = $this->getAvailableVersions($moduleName);

        if (empty($allVersions)) {
            return [];
        }

        // Version cible : la dernière si non spécifiée
        $toVersion = $toVersion ?? $this->getLatestVersion($moduleName);

        // Filtrer les versions à appliquer
        $versionsToApply = [];

        foreach ($allVersions as $version) {
            // Si fromVersion est null, on prend toutes les versions jusqu'à toVersion
            if ($fromVersion === null) {
                if (version_compare($version, $toVersion, '<=')) {
                    $versionsToApply[] = $version;
                }
            } else {
                // Sinon, on prend les versions > fromVersion et <= toVersion
                if (version_compare($version, $fromVersion, '>') && version_compare($version, $toVersion, '<=')) {
                    $versionsToApply[] = $version;
                }
            }
        }

        return $versionsToApply;
    }

    /**
     * {@inheritdoc}
     */
    public function getVersionsToDowngrade(string $moduleName, string $fromVersion, ?string $toVersion = null): array
    {
        $allVersions = $this->getAvailableVersions($moduleName);

        if (empty($allVersions)) {
            return [];
        }

        // Filtrer et inverser l'ordre
        $versionsToDowngrade = [];

        foreach ($allVersions as $version) {
            // Si toVersion est null, on downgrade toutes les versions <= fromVersion
            if ($toVersion === null) {
                if (version_compare($version, $fromVersion, '<=')) {
                    $versionsToDowngrade[] = $version;
                }
            } else {
                // Sinon, on downgrade les versions <= fromVersion et > toVersion
                if (version_compare($version, $fromVersion, '<=') && version_compare($version, $toVersion, '>')) {
                    $versionsToDowngrade[] = $version;
                }
            }
        }

        // Inverser l'ordre pour le downgrade (de la plus récente à la plus ancienne)
        usort($versionsToDowngrade, function ($a, $b) {
            return version_compare($b, $a);
        });

        return $versionsToDowngrade;
    }

    /**
     * {@inheritdoc}
     */
    public function getLatestVersion(string $moduleName): ?string
    {
        $versions = $this->getAvailableVersions($moduleName);
        return !empty($versions) ? end($versions) : null;
    }

    /**
     * {@inheritdoc}
     */
    public function hasSchemaFile(string $moduleName): bool
    {
        return file_exists($this->getSchemaFilePath($moduleName) ?? '');
    }

    /**
     * {@inheritdoc}
     */
    public function hasDropFile(string $moduleName): bool
    {
        return file_exists($this->getDropFilePath($moduleName) ?? '');
    }

    /**
     * {@inheritdoc}
     */
    public function getSchemaFilePath(string $moduleName): ?string
    {
        $path = $this->getModuleBasePath($moduleName) . '/models/schema.sql';
        return file_exists($path) ? $path : null;
    }

    /**
     * {@inheritdoc}
     */
    public function getDropFilePath(string $moduleName): ?string
    {
        $path = $this->getModuleBasePath($moduleName) . '/models/drop.sql';
        return file_exists($path) ? $path : null;
    }

    /**
     * {@inheritdoc}
     */
    public function hasUpgradeAction(string $moduleName, string $version): bool
    {
        $actionPath = $this->getUpgradeActionPath($moduleName, $version);
        $sqlPath = $this->getUpgradeSqlPath($moduleName, $version);

        return file_exists($actionPath) || file_exists($sqlPath);
    }

    /**
     * {@inheritdoc}
     */
    public function hasDowngradeAction(string $moduleName, string $version): bool
    {
        $actionPath = $this->getDowngradeActionPath($moduleName, $version);
        $sqlPath = $this->getDowngradeSqlPath($moduleName, $version);

        return file_exists($actionPath) || file_exists($sqlPath);
    }

    /**
     * {@inheritdoc}
     */
    public function getVersionInfo(string $moduleName, string $version): array
    {
        $versionPath = $this->getVersionPath($moduleName, $version);

        return [
            'version' => $version,
            'path' => $versionPath,
            'exists' => is_dir($versionPath),
            'has_upgrade_action' => file_exists($this->getUpgradeActionPath($moduleName, $version)),
            'has_downgrade_action' => file_exists($this->getDowngradeActionPath($moduleName, $version)),
            'has_upgrade_sql' => file_exists($this->getUpgradeSqlPath($moduleName, $version)),
            'has_downgrade_sql' => file_exists($this->getDowngradeSqlPath($moduleName, $version)),
            'upgrade_action_path' => $this->getUpgradeActionPath($moduleName, $version),
            'downgrade_action_path' => $this->getDowngradeActionPath($moduleName, $version),
            'upgrade_sql_path' => $this->getUpgradeSqlPath($moduleName, $version),
            'downgrade_sql_path' => $this->getDowngradeSqlPath($moduleName, $version),
        ];
    }

    /**
     * Retourne le chemin de base du module Database
     */
    public function getModuleBasePath(string $moduleName): string
    {
        return base_path("Modules/{$moduleName}/Database");
    }

    /**
     * Retourne le chemin d'une version
     */
    public function getVersionPath(string $moduleName, string $version): string
    {
        return $this->getModuleBasePath($moduleName) . "/updates/{$version}";
    }

    /**
     * Retourne le chemin vers l'action upgrade
     */
    public function getUpgradeActionPath(string $moduleName, string $version): string
    {
        return $this->getVersionPath($moduleName, $version) . '/actions/upgradeAction.class.php';
    }

    /**
     * Retourne le chemin vers l'action downgrade
     */
    public function getDowngradeActionPath(string $moduleName, string $version): string
    {
        return $this->getVersionPath($moduleName, $version) . '/actions/downgradeAction.class.php';
    }

    /**
     * Retourne le chemin vers le SQL upgrade
     */
    public function getUpgradeSqlPath(string $moduleName, string $version): string
    {
        return $this->getVersionPath($moduleName, $version) . '/models/upgrade.sql';
    }

    /**
     * Retourne le chemin vers le SQL downgrade
     */
    public function getDowngradeSqlPath(string $moduleName, string $version): string
    {
        return $this->getVersionPath($moduleName, $version) . '/models/downgrade.sql';
    }

    /**
     * Valide qu'un nom de version est valide (format X.Y ou X.Y.Z)
     */
    protected function isValidVersionName(string $name): bool
    {
        // Accepte les formats: 1.0, 1.1, 2.0, 1.0.1, etc.
        return (bool) preg_match('/^\d+\.\d+(\.\d+)?$/', $name);
    }

    /**
     * Vide le cache des versions
     */
    public function clearCache(?string $moduleName = null): void
    {
        if ($moduleName) {
            unset($this->versionCache[$moduleName]);
        } else {
            $this->versionCache = [];
        }
    }
}
