<?php

namespace Modules\Superadmin\Services\Legacy;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Exceptions\LegacySqlImportException;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

/**
 * Service d'importation de fichiers SQL legacy (remplace importDatabase de Symfony 1)
 *
 * Ce service permet d'exécuter les fichiers SQL des modules legacy
 * (schema.sql, drop.sql, upgrade.sql, downgrade.sql) dans le contexte
 * d'un tenant spécifique.
 */
class LegacySqlImporter implements LegacySqlImporterInterface
{
    use LogsSuperadminActivity;

    /**
     * Délimiteur de fin de statement SQL
     */
    protected string $delimiter = ';';

    /**
     * Mode de transaction (wrappe les statements dans une transaction)
     * Désactivé par défaut pour les imports legacy qui doivent être idempotents
     * (MySQL annule automatiquement la transaction sur erreur, même si on veut l'ignorer)
     */
    protected bool $useTransaction = false;

    /**
     * Continue l'exécution même en cas d'erreur
     */
    protected bool $continueOnError = false;

    /**
     * Erreurs SQL considérées comme "safe" (idempotent) - on peut les ignorer
     * Ces erreurs indiquent que l'opération a déjà été effectuée
     */
    protected array $idempotentErrorCodes = [
        '42S21', // Column already exists (MySQL 1060)
        '42S01', // Table already exists (MySQL 1050)
        '42000', // Duplicate key name (MySQL 1061) - pour les index
        '23000', // Duplicate entry (peut être ignoré dans certains cas)
    ];

    /**
     * Patterns d'erreur à ignorer (regex)
     */
    protected array $idempotentErrorPatterns = [
        '/Duplicate column name/i',
        '/Table .* already exists/i',
        '/Duplicate key name/i',
        '/Can\'t DROP .* check that .* exists/i', // DROP sur quelque chose qui n'existe pas
        '/Unknown column .* in \'DROP\'/i',
    ];

    /**
     * Singleton pour compatibilité Symfony 1
     */
    private static ?self $instance = null;

    /**
     * Retourne l'instance singleton (compatibilité Symfony 1: importDatabase::getInstance())
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * {@inheritdoc}
     */
    public function import(string $filePath, Tenant $tenant): array
    {
        if (!$this->isValidSqlFile($filePath)) {
            throw LegacySqlImportException::fileNotReadable($filePath);
        }

        $sql = file_get_contents($filePath);

        if ($sql === false || trim($sql) === '') {
            $this->logInfo('Empty SQL file, skipping', [
                'file' => $filePath,
                'tenant_id' => $tenant->site_id,
            ]);
            return [
                'success' => true,
                'statements' => 0,
                'errors' => [],
                'file' => $filePath,
            ];
        }

        $this->logInfo('Importing SQL file', [
            'file' => $filePath,
            'tenant_id' => $tenant->site_id,
            'size' => strlen($sql),
        ]);

        return $this->importRaw($sql, $tenant, $filePath);
    }

    /**
     * {@inheritdoc}
     */
    public function importRaw(string $sql, Tenant $tenant, ?string $sourceFile = null): array
    {
        $statements = $this->parseSqlContent($sql);
        $executedCount = 0;
        $skippedIdempotent = 0;
        $errors = [];

        try {
            // Initialiser le contexte tenant
            tenancy()->initialize($tenant);

            if ($this->useTransaction) {
                DB::beginTransaction();
            }

            foreach ($statements as $index => $statement) {
                $statement = trim($statement);

                // Ignorer les statements vides ou commentaires seuls
                if (empty($statement) || $this->isCommentOnly($statement)) {
                    continue;
                }

                try {
                    DB::unprepared($statement);
                    $executedCount++;

                    $this->logDebug('Statement executed', [
                        'index' => $index,
                        'statement_preview' => substr($statement, 0, 100),
                    ]);
                } catch (\Exception $e) {
                    // Vérifier si c'est une erreur idempotente (safe à ignorer)
                    if ($this->isIdempotentError($e)) {
                        $this->logInfo('Idempotent error ignored (already applied)', [
                            'index' => $index,
                            'statement_preview' => substr($statement, 0, 100),
                            'error' => $e->getMessage(),
                        ]);
                        $skippedIdempotent++;
                        continue; // Passer au statement suivant
                    }

                    $error = [
                        'statement_index' => $index,
                        'statement' => substr($statement, 0, 200),
                        'error' => $e->getMessage(),
                    ];
                    $errors[] = $error;

                    $this->logError('Statement failed', $error);

                    if (!$this->continueOnError) {
                        tenancy()->end();
                        throw LegacySqlImportException::statementFailed(
                            $statement,
                            $e->getMessage(),
                            $sourceFile
                        );
                    }
                }
            }

            if ($this->useTransaction) {
                DB::commit();
            }

            tenancy()->end();

            $this->logInfo('SQL import completed', [
                'file' => $sourceFile,
                'tenant_id' => $tenant->site_id,
                'statements_executed' => $executedCount,
                'statements_skipped_idempotent' => $skippedIdempotent,
                'errors_count' => count($errors),
            ]);

            return [
                'success' => empty($errors),
                'skipped_idempotent' => $skippedIdempotent,
                'statements' => $executedCount,
                'errors' => $errors,
                'file' => $sourceFile,
            ];

        } catch (LegacySqlImportException $e) {
            throw $e;
        } catch (\Exception $e) {
            if ($this->useTransaction) {
                try {
                    DB::rollBack();
                } catch (\Exception $rollbackException) {
                    // Ignorer les erreurs de rollback
                }
            }
            tenancy()->end();

            throw LegacySqlImportException::importFailed($sourceFile ?? 'raw_sql', $e->getMessage());
        }
    }

    /**
     * {@inheritdoc}
     */
    public function isValidSqlFile(string $filePath): bool
    {
        return file_exists($filePath)
            && is_readable($filePath)
            && pathinfo($filePath, PATHINFO_EXTENSION) === 'sql';
    }

    /**
     * {@inheritdoc}
     */
    public function parseStatements(string $filePath): array
    {
        if (!$this->isValidSqlFile($filePath)) {
            return [];
        }

        $sql = file_get_contents($filePath);
        return $this->parseSqlContent($sql);
    }

    /**
     * Parse le contenu SQL en statements individuels
     * Gère les délimiteurs personnalisés (DELIMITER)
     */
    protected function parseSqlContent(string $sql): array
    {
        // Supprimer les commentaires de bloc /* */
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);

        // Normaliser les fins de ligne
        $sql = str_replace(["\r\n", "\r"], "\n", $sql);

        $statements = [];
        $currentStatement = '';
        $delimiter = $this->delimiter;
        $inString = false;
        $stringChar = '';
        $escaped = false;

        $lines = explode("\n", $sql);

        foreach ($lines as $line) {
            $trimmedLine = trim($line);

            // Ignorer les lignes de commentaire
            if (str_starts_with($trimmedLine, '--') || str_starts_with($trimmedLine, '#')) {
                continue;
            }

            // Gérer le changement de délimiteur (pour les procédures stockées)
            if (preg_match('/^DELIMITER\s+(.+)$/i', $trimmedLine, $matches)) {
                $delimiter = trim($matches[1]);
                continue;
            }

            // Parser caractère par caractère pour respecter les strings
            $lineLength = strlen($line);
            for ($i = 0; $i < $lineLength; $i++) {
                $char = $line[$i];

                // Gérer l'échappement
                if ($escaped) {
                    $currentStatement .= $char;
                    $escaped = false;
                    continue;
                }

                // Détecter le caractère d'échappement
                if ($char === '\\') {
                    $escaped = true;
                    $currentStatement .= $char;
                    continue;
                }

                // Gérer les strings
                if ($inString) {
                    $currentStatement .= $char;
                    if ($char === $stringChar) {
                        $inString = false;
                    }
                    continue;
                }

                // Détecter le début d'une string
                if ($char === "'" || $char === '"') {
                    $inString = true;
                    $stringChar = $char;
                    $currentStatement .= $char;
                    continue;
                }

                // Vérifier si on atteint le délimiteur
                if (substr($line, $i, strlen($delimiter)) === $delimiter) {
                    $statement = trim($currentStatement);
                    if (!empty($statement)) {
                        $statements[] = $statement;
                    }
                    $currentStatement = '';
                    $i += strlen($delimiter) - 1;
                    continue;
                }

                $currentStatement .= $char;
            }

            $currentStatement .= "\n";
        }

        // Ajouter le dernier statement s'il existe
        $finalStatement = trim($currentStatement);
        if (!empty($finalStatement) && !$this->isCommentOnly($finalStatement)) {
            $statements[] = $finalStatement;
        }

        return $statements;
    }

    /**
     * Vérifie si un statement ne contient que des commentaires
     */
    protected function isCommentOnly(string $statement): bool
    {
        $cleaned = preg_replace('/--.*$/m', '', $statement);
        $cleaned = preg_replace('/#.*$/m', '', $cleaned);
        return empty(trim($cleaned));
    }

    /**
     * Vérifie si une exception SQL est une erreur idempotente (safe à ignorer)
     *
     * Les erreurs idempotentes sont celles qui indiquent que l'opération
     * a déjà été effectuée (ex: colonne existe déjà, table existe déjà)
     */
    protected function isIdempotentError(\Exception $e): bool
    {
        $message = $e->getMessage();

        // Vérifier par code SQLSTATE si c'est une QueryException
        if ($e instanceof \Illuminate\Database\QueryException) {
            $sqlState = $e->errorInfo[0] ?? null;
            $errorCode = $e->errorInfo[1] ?? null;

            // Codes MySQL spécifiques
            $idempotentMysqlCodes = [
                1060, // Duplicate column name
                1050, // Table already exists
                1061, // Duplicate key name
                1091, // Can't DROP - check that it exists
                1054, // Unknown column (pour DROP COLUMN qui n'existe pas)
            ];

            if (in_array($errorCode, $idempotentMysqlCodes)) {
                return true;
            }

            // Vérifier par SQLSTATE
            if (in_array($sqlState, $this->idempotentErrorCodes)) {
                return true;
            }
        }

        // Vérifier par pattern dans le message d'erreur
        foreach ($this->idempotentErrorPatterns as $pattern) {
            if (preg_match($pattern, $message)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Configure le mode de transaction
     */
    public function setUseTransaction(bool $useTransaction): self
    {
        $this->useTransaction = $useTransaction;
        return $this;
    }

    /**
     * Configure la continuation en cas d'erreur
     */
    public function setContinueOnError(bool $continueOnError): self
    {
        $this->continueOnError = $continueOnError;
        return $this;
    }

    /**
     * Log debug
     */
    protected function logDebug(string $message, array $context = []): void
    {
        Log::debug("LegacySqlImporter: {$message}", $context);
    }
}
