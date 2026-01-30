<?php

namespace Modules\Superadmin\Services;

interface TenantStorageManagerInterface
{
    /**
     * Crée la structure de fichiers pour un module
     */
    public function createModuleStructure(int $tenantId, string $moduleName): void;

    /**
     * Vérifie si la structure du module existe
     */
    public function moduleStructureExists(int $tenantId, string $moduleName): bool;

    /**
     * Retourne le chemin de base pour un module d'un tenant
     */
    public function getModulePath(int $tenantId, string $moduleName): string;

    /**
     * Retourne le chemin de base pour un tenant
     */
    public function getTenantPath(int $tenantId): string;

    /**
     * Liste les fichiers d'un module
     */
    public function listModuleFiles(int $tenantId, string $moduleName): array;

    /**
     * Retourne la taille totale d'un module en bytes
     */
    public function getModuleSize(int $tenantId, string $moduleName): int;

    /**
     * Génère le fichier de configuration pour un module
     */
    public function generateModuleConfig(int $tenantId, string $moduleName, array $config = []): void;

    /**
     * Met à jour la configuration d'un module
     */
    public function updateModuleConfig(int $tenantId, string $moduleName, array $config): void;

    /**
     * Lit la configuration d'un module
     */
    public function readModuleConfig(int $tenantId, string $moduleName): ?array;

    /**
     * Supprime la configuration d'un module
     */
    public function deleteModuleConfig(int $tenantId, string $moduleName): void;

    /**
     * Supprime la structure de fichiers d'un module
     */
    public function deleteModuleStructure(int $tenantId, string $moduleName): void;

    /**
     * Vérifie si des fichiers existent dans la structure du module
     */
    public function hasModuleFiles(int $tenantId, string $moduleName): bool;

    /**
     * Compte les fichiers d'un module
     */
    public function countModuleFiles(int $tenantId, string $moduleName): int;

    /**
     * Crée un backup des fichiers d'un module
     * Retourne le chemin du backup ou null si aucun fichier à sauvegarder
     */
    public function backupModule(int $tenantId, string $moduleName): ?string;

    /**
     * Liste les backups d'un tenant
     */
    public function listBackups(int $tenantId, ?string $moduleName = null): array;

    /**
     * Supprime un backup
     */
    public function deleteBackup(string $backupPath): void;
}
