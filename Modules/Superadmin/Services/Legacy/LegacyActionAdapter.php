<?php

namespace Modules\Superadmin\Services\Legacy;

use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

/**
 * Adaptateur pour exécuter les classes d'action legacy
 *
 * Cette classe charge et exécute les fichiers upgradeAction.class.php et
 * downgradeAction.class.php qui étendent l'ancienne classe mfModuleUpdate.
 *
 * Elle injecte les dépendances nécessaires et fournit les méthodes de
 * compatibilité (getSite, getModelsPath, etc.) attendues par les classes legacy.
 *
 * Fonctionnement :
 * 1. Charge le fichier PHP de l'action
 * 2. Détermine le nom de la classe (ex: users_upgrade_10_Action)
 * 3. Crée un contexte d'exécution avec les méthodes de compatibilité
 * 4. Exécute la méthode execute() de l'action
 */
class LegacyActionAdapter
{
    protected Tenant $tenant;
    protected string $moduleName;
    protected string $version;
    protected LegacySqlImporterInterface $sqlImporter;
    protected string $actionFilePath;
    protected string $actionType; // 'upgrade' ou 'downgrade'
    protected array $executedFiles = [];

    public function __construct(
        Tenant $tenant,
        string $moduleName,
        string $version,
        LegacySqlImporterInterface $sqlImporter,
        string $actionFilePath,
        string $actionType
    ) {
        $this->tenant = $tenant;
        $this->moduleName = $moduleName;
        $this->version = $version;
        $this->sqlImporter = $sqlImporter;
        $this->actionFilePath = $actionFilePath;
        $this->actionType = $actionType;
    }

    /**
     * Exécute l'action legacy
     *
     * @throws \RuntimeException Si l'action échoue
     */
    public function execute(): void
    {
        if (!file_exists($this->actionFilePath)) {
            throw new \RuntimeException("Action file not found: {$this->actionFilePath}");
        }

        Log::info("LegacyActionAdapter: Loading action file", [
            'file' => $this->actionFilePath,
            'module' => $this->moduleName,
            'version' => $this->version,
            'type' => $this->actionType,
        ]);

        try {
            // Définir la classe de base avant d'inclure le fichier
            $this->defineBaseClass();

            // Trouver le nom de la classe AVANT d'inclure le fichier
            $className = $this->resolveClassName();

            // Inclure le fichier d'action
            require_once $this->actionFilePath;

            if (!class_exists($className)) {
                throw new \RuntimeException("Action class not found after include: {$className}");
            }

            Log::info("LegacyActionAdapter: Executing action class", [
                'class' => $className,
                'parent' => get_parent_class($className),
            ]);

            // Créer l'instance et exécuter
            $action = new $className(
                $this->tenant,
                $this->moduleName,
                $this->version,
                $this->sqlImporter
            );

            Log::info("LegacyActionAdapter: Instance created, calling execute()");

            $action->execute();

            $this->executedFiles = $action->getExecutedFiles();

            Log::info("LegacyActionAdapter: Action completed successfully", [
                'executed_files' => $this->executedFiles,
            ]);

        } catch (\Throwable $e) {
            Log::error("LegacyActionAdapter: Action execution failed", [
                'file' => $this->actionFilePath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \RuntimeException("Legacy action failed: " . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Définit la classe de base mfModuleUpdate comme alias de LegacyModuleUpdate
     *
     * Cela permet aux anciennes classes qui font "extends mfModuleUpdate"
     * de fonctionner sans modification.
     */
    protected function defineBaseClass(): void
    {
        // Créer l'alias seulement s'il n'existe pas
        if (!class_exists('mfModuleUpdate', false)) {
            class_alias(LegacyModuleUpdate::class, 'mfModuleUpdate');
        }

        // Créer également un mock pour importDatabase::getInstance()
        if (!class_exists('importDatabase', false)) {
            $this->defineImportDatabaseClass();
        }
    }

    /**
     * Définit la classe importDatabase pour compatibilité
     */
    protected function defineImportDatabaseClass(): void
    {
        // Utiliser eval pour créer la classe dans le namespace global
        // C'est nécessaire car les classes legacy s'attendent à importDatabase sans namespace
        if (!class_exists('importDatabase', false)) {
            // La classe sera définie via un fichier séparé pour éviter eval
            require_once __DIR__ . '/ImportDatabaseCompat.php';
        }
    }

    /**
     * Résout le nom de la classe d'action
     *
     * Les classes legacy suivent le pattern:
     * - {modulename}_upgrade_{version_sans_point}_Action (ex: users_upgrade_10_Action)
     * - {modulename}_downgrade_{version_sans_point}_Action
     *
     * Note: Le nom du module peut varier (User -> users, user, User, etc.)
     * On parse donc le fichier pour trouver le vrai nom de classe.
     */
    protected function resolveClassName(): string
    {
        // Lire le contenu du fichier pour trouver le nom de classe réel
        $content = file_get_contents($this->actionFilePath);

        // Pattern pour trouver "class XXX extends"
        if (preg_match('/class\s+(\w+)\s+extends/i', $content, $matches)) {
            $className = $matches[1];

            Log::debug("LegacyActionAdapter: Found class name in file", [
                'class' => $className,
                'file' => $this->actionFilePath,
            ]);

            return $className;
        }

        // Fallback: construire le nom de classe avec le pattern standard
        $moduleNameLower = strtolower($this->moduleName);
        $versionNumber = str_replace('.', '', $this->version);
        $className = "{$moduleNameLower}_{$this->actionType}_{$versionNumber}_Action";

        Log::debug("LegacyActionAdapter: Using fallback class name", [
            'expected' => $className,
            'module' => $this->moduleName,
            'version' => $this->version,
            'type' => $this->actionType,
        ]);

        return $className;
    }

    /**
     * Retourne les fichiers exécutés par l'action
     */
    public function getExecutedFiles(): array
    {
        return $this->executedFiles;
    }
}
