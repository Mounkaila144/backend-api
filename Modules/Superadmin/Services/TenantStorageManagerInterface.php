<?php

namespace Modules\Superadmin\Services;

interface TenantStorageManagerInterface
{
    /**
     * Initialise la structure de base d'un tenant (conforme à Symfony 1)
     */
    public function initializeTenantStructure(int $tenantId): void;

    /**
     * Vérifie si la structure de base du tenant existe
     */
    public function tenantStructureExists(int $tenantId): bool;

    /**
     * Crée la structure de fichiers pour un module
     */
    public function createModuleStructure(int $tenantId, string $moduleName): void;

    /**
     * Vérifie si la structure du module existe
     */
    public function moduleStructureExists(int $tenantId, string $moduleName): bool;

    /**
     * Retourne le chemin de base pour un tenant
     */
    public function getTenantPath(int $tenantId): string;

    /**
     * Retourne le chemin admin/data pour un tenant
     */
    public function getAdminDataPath(int $tenantId): string;

    /**
     * Retourne le chemin frontend/data pour un tenant
     */
    public function getFrontendDataPath(int $tenantId): string;

    /**
     * Retourne le chemin frontend/view/data pour un tenant (assets publics)
     */
    public function getFrontendViewDataPath(int $tenantId): string;

    /**
     * Retourne le chemin pour un type spécifique de données
     * @param string $type Exemples: 'customers/documents', 'contracts/exports'
     * @param string $layer 'admin' ou 'frontend'
     * @param string $dataType 'data' ou 'view/data'
     */
    public function getDataPath(int $tenantId, string $type, string $layer = 'admin', string $dataType = 'data'): string;

    /**
     * Retourne le chemin pour un document spécifique d'une entité
     * @param int $entityId ID de l'entité (customer_id, contract_id, etc.)
     */
    public function getEntityPath(int $tenantId, string $type, int $entityId, string $layer = 'admin'): string;

    /**
     * Retourne le chemin pour les assets d'une company
     */
    public function getCompanyAssetsPath(int $tenantId, int $companyId, string $category = 'site'): string;

    /**
     * Liste les fichiers d'un chemin relatif
     */
    public function listFiles(int $tenantId, string $relativePath): array;

    /**
     * Liste les fichiers d'un module
     */
    public function listModuleFiles(int $tenantId, string $moduleName): array;

    /**
     * Retourne la taille totale des fichiers d'un chemin
     */
    public function getPathSize(int $tenantId, string $relativePath): int;

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
     * Sauvegarde un fichier de settings (format .dat comme Symfony 1)
     */
    public function saveSettings(int $tenantId, string $name, array $data, string $layer = 'admin'): void;

    /**
     * Lit un fichier de settings
     */
    public function readSettings(int $tenantId, string $name, string $layer = 'admin'): ?array;

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

    /**
     * Upload un fichier vers le stockage tenant
     */
    public function uploadFile(int $tenantId, string $relativePath, $content, string $filename): string;

    /**
     * Télécharge un fichier depuis le stockage tenant
     */
    public function downloadFile(int $tenantId, string $relativePath): ?string;

    /**
     * Supprime un fichier du stockage tenant
     */
    public function deleteFile(int $tenantId, string $relativePath): bool;

    /**
     * Retourne l'URL publique d'un fichier (si disponible)
     */
    public function getFileUrl(int $tenantId, string $relativePath): ?string;

    /**
     * Retourne une URL temporaire signée pour un fichier (S3 uniquement)
     */
    public function getTemporaryUrl(int $tenantId, string $relativePath, int $minutes = 60): ?string;

    /**
     * Vérifie si S3 est disponible
     */
    public function isS3Available(): bool;

    /**
     * Retourne le disque actuellement utilisé
     */
    public function getCurrentDisk(): string;

    /**
     * Retourne le chemin de base pour un module d'un tenant (compatibilité)
     * @deprecated Utiliser les méthodes spécifiques getAdminDataPath, getFrontendDataPath, etc.
     */
    public function getModulePath(int $tenantId, string $moduleName): string;
}
