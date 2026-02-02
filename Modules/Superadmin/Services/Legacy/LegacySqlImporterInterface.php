<?php

namespace Modules\Superadmin\Services\Legacy;

use App\Models\Tenant;

/**
 * Interface pour l'importation de fichiers SQL legacy
 */
interface LegacySqlImporterInterface
{
    /**
     * Importe un fichier SQL dans la base de données du tenant
     *
     * @param string $filePath Chemin absolu vers le fichier SQL
     * @param Tenant $tenant Le tenant cible
     * @return array Résultat de l'importation ['success' => bool, 'statements' => int, 'errors' => array]
     * @throws \Modules\Superadmin\Exceptions\LegacySqlImportException
     */
    public function import(string $filePath, Tenant $tenant): array;

    /**
     * Importe du SQL brut dans la base de données du tenant
     *
     * @param string $sql Contenu SQL à exécuter
     * @param Tenant $tenant Le tenant cible
     * @return array Résultat de l'importation
     */
    public function importRaw(string $sql, Tenant $tenant): array;

    /**
     * Vérifie si un fichier SQL est valide
     *
     * @param string $filePath Chemin vers le fichier
     * @return bool
     */
    public function isValidSqlFile(string $filePath): bool;

    /**
     * Parse un fichier SQL en statements individuels
     *
     * @param string $filePath Chemin vers le fichier
     * @return array Liste des statements SQL
     */
    public function parseStatements(string $filePath): array;
}
