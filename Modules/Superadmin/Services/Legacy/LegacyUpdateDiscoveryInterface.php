<?php

namespace Modules\Superadmin\Services\Legacy;

/**
 * Interface pour la découverte des mises à jour legacy
 */
interface LegacyUpdateDiscoveryInterface
{
    /**
     * Vérifie si un module possède des fichiers legacy (schema.sql, updates/)
     */
    public function hasLegacyStructure(string $moduleName): bool;

    /**
     * Retourne toutes les versions disponibles pour un module
     *
     * @return array<string> Liste des versions triées (ex: ['1.0', '1.1', '2.0'])
     */
    public function getAvailableVersions(string $moduleName): array;

    /**
     * Retourne les versions à appliquer pour passer d'une version à une autre
     *
     * @param string $moduleName
     * @param string|null $fromVersion Version actuelle (null = nouvelle installation)
     * @param string|null $toVersion Version cible (null = dernière version)
     * @return array<string> Versions à appliquer dans l'ordre
     */
    public function getVersionsToApply(string $moduleName, ?string $fromVersion = null, ?string $toVersion = null): array;

    /**
     * Retourne les versions à appliquer pour un downgrade
     *
     * @param string $moduleName
     * @param string $fromVersion Version actuelle
     * @param string|null $toVersion Version cible (null = tout supprimer)
     * @return array<string> Versions à rétrograder dans l'ordre inverse
     */
    public function getVersionsToDowngrade(string $moduleName, string $fromVersion, ?string $toVersion = null): array;

    /**
     * Retourne la dernière version disponible pour un module
     */
    public function getLatestVersion(string $moduleName): ?string;

    /**
     * Vérifie si un module a un fichier schema.sql
     */
    public function hasSchemaFile(string $moduleName): bool;

    /**
     * Vérifie si un module a un fichier drop.sql
     */
    public function hasDropFile(string $moduleName): bool;

    /**
     * Retourne le chemin vers le fichier schema.sql
     */
    public function getSchemaFilePath(string $moduleName): ?string;

    /**
     * Retourne le chemin vers le fichier drop.sql
     */
    public function getDropFilePath(string $moduleName): ?string;

    /**
     * Vérifie si une action upgrade existe pour une version
     */
    public function hasUpgradeAction(string $moduleName, string $version): bool;

    /**
     * Vérifie si une action downgrade existe pour une version
     */
    public function hasDowngradeAction(string $moduleName, string $version): bool;

    /**
     * Retourne les métadonnées d'une version
     */
    public function getVersionInfo(string $moduleName, string $version): array;
}
