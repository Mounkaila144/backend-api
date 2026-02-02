<?php

namespace Modules\Superadmin\Services\Legacy;

use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

/**
 * Classe de base pour les actions de mise à jour legacy (remplace mfModuleUpdate de Symfony 1)
 *
 * Cette classe fournit l'interface compatible avec les classes upgradeAction.class.php
 * et downgradeAction.class.php existantes dans les modules.
 *
 * IMPORTANT: Cette classe n'utilise PAS de types de retour stricts pour maintenir
 * la compatibilité avec les classes PHP 5.x existantes.
 *
 * @example
 * // Usage dans upgradeAction.class.php existant:
 * class users_upgrade_10_Action extends mfModuleUpdate {
 *     function execute() {
 *         $site = $this->getSite();
 *         $files = [$this->getModelsPath() . "/upgrade.sql"];
 *         $importDB = importDatabase::getInstance();
 *         foreach ($files as $file) {
 *             $importDB->import($file, $site);
 *         }
 *     }
 * }
 */
class LegacyModuleUpdate
{
    protected Tenant $tenant;
    protected string $moduleName;
    protected string $version;
    protected string $basePath;
    protected LegacySqlImporterInterface $sqlImporter;
    protected array $executedFiles = [];
    protected array $errors = [];

    public function __construct(
        Tenant $tenant,
        string $moduleName,
        string $version,
        LegacySqlImporterInterface $sqlImporter
    ) {
        $this->tenant = $tenant;
        $this->moduleName = $moduleName;
        $this->version = $version;
        $this->sqlImporter = $sqlImporter;
        $this->basePath = base_path("Modules/{$moduleName}/Database");
    }

    /**
     * Méthode à implémenter par les classes d'action
     * Note: Pas de type de retour pour compatibilité avec les classes legacy PHP 5.x
     */
    public function execute()
    {
        // Méthode par défaut vide - les classes legacy la surchargent
    }

    /**
     * Retourne le tenant courant (compatible Symfony 1: getSite())
     */
    public function getSite(): Tenant
    {
        return $this->tenant;
    }

    /**
     * Alias pour getSite() - compatibilité
     */
    public function getTenant(): Tenant
    {
        return $this->tenant;
    }

    /**
     * Retourne le chemin vers le dossier models de la version courante
     * Compatible Symfony 1: getModelsPath()
     */
    public function getModelsPath(): string
    {
        return "{$this->basePath}/updates/{$this->version}/models";
    }

    /**
     * Retourne le chemin vers le dossier d'update courant
     * Compatible Symfony 1: getUpdateDirectory()
     */
    public function getUpdateDirectory(): string
    {
        return "{$this->basePath}/updates/{$this->version}";
    }

    /**
     * Retourne le chemin de base du module
     */
    public function getModuleBasePath(): string
    {
        return $this->basePath;
    }

    /**
     * Retourne le nom du module
     */
    public function getModuleName(): string
    {
        return $this->moduleName;
    }

    /**
     * Retourne la version courante
     */
    public function getVersion(): string
    {
        return $this->version;
    }

    /**
     * Retourne l'importateur SQL (compatible Symfony 1: importDatabase::getInstance())
     */
    public function getImportDatabase(): LegacySqlImporterInterface
    {
        return $this->sqlImporter;
    }

    /**
     * Importe un fichier SQL directement
     * Méthode helper pour simplifier les actions
     */
    protected function importSqlFile(string $filePath): bool
    {
        if (!is_readable($filePath)) {
            Log::warning("LegacyModuleUpdate: File not readable", [
                'file' => $filePath,
                'module' => $this->moduleName,
                'version' => $this->version,
            ]);
            return false;
        }

        try {
            $this->sqlImporter->import($filePath, $this->tenant);
            $this->executedFiles[] = $filePath;
            return true;
        } catch (\Exception $e) {
            $this->errors[] = [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ];
            throw $e;
        }
    }

    /**
     * Retourne la liste des fichiers exécutés
     */
    public function getExecutedFiles(): array
    {
        return $this->executedFiles;
    }

    /**
     * Retourne les erreurs rencontrées
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Log une information
     */
    protected function log(string $message, array $context = []): void
    {
        Log::info("LegacyModuleUpdate [{$this->moduleName}@{$this->version}]: {$message}", $context);
    }

    /**
     * Log une erreur
     */
    protected function logError(string $message, array $context = []): void
    {
        Log::error("LegacyModuleUpdate [{$this->moduleName}@{$this->version}]: {$message}", $context);
    }
}
