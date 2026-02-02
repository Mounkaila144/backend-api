<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

/**
 * Exception pour les erreurs d'importation SQL legacy
 */
class LegacySqlImportException extends Exception
{
    protected string $sqlFile;
    protected ?string $failedStatement;
    protected array $context = [];

    /**
     * Fichier SQL non lisible
     */
    public static function fileNotReadable(string $filePath): self
    {
        $exception = new self("SQL file not readable: {$filePath}");
        $exception->sqlFile = $filePath;
        $exception->context = ['file' => $filePath];
        return $exception;
    }

    /**
     * Fichier SQL non trouvé
     */
    public static function fileNotFound(string $filePath): self
    {
        $exception = new self("SQL file not found: {$filePath}");
        $exception->sqlFile = $filePath;
        $exception->context = ['file' => $filePath];
        return $exception;
    }

    /**
     * Statement SQL échoué
     */
    public static function statementFailed(string $statement, string $error, ?string $file = null): self
    {
        $preview = strlen($statement) > 100 ? substr($statement, 0, 100) . '...' : $statement;
        $exception = new self("SQL statement failed: {$error}. Statement: {$preview}");
        $exception->failedStatement = $statement;
        $exception->sqlFile = $file ?? '';
        $exception->context = [
            'statement' => $statement,
            'error' => $error,
            'file' => $file,
        ];
        return $exception;
    }

    /**
     * Import global échoué
     */
    public static function importFailed(string $file, string $error): self
    {
        $exception = new self("Failed to import SQL file '{$file}': {$error}");
        $exception->sqlFile = $file;
        $exception->context = [
            'file' => $file,
            'error' => $error,
        ];
        return $exception;
    }

    /**
     * Version non trouvée
     */
    public static function versionNotFound(string $moduleName, string $version): self
    {
        $exception = new self("Version {$version} not found for module {$moduleName}");
        $exception->context = [
            'module' => $moduleName,
            'version' => $version,
        ];
        return $exception;
    }

    /**
     * Action non trouvée
     */
    public static function actionNotFound(string $moduleName, string $version, string $actionType): self
    {
        $exception = new self("Action '{$actionType}' not found for module {$moduleName} version {$version}");
        $exception->context = [
            'module' => $moduleName,
            'version' => $version,
            'action_type' => $actionType,
        ];
        return $exception;
    }

    /**
     * Retourne le fichier SQL concerné
     */
    public function getSqlFile(): string
    {
        return $this->sqlFile ?? '';
    }

    /**
     * Retourne le statement qui a échoué
     */
    public function getFailedStatement(): ?string
    {
        return $this->failedStatement ?? null;
    }

    /**
     * Retourne le contexte de l'exception
     */
    public function getContext(): array
    {
        return $this->context;
    }
}
