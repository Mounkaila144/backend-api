<?php

namespace Modules\Superadmin\Services\Legacy;

use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Exceptions\LegacySqlImportException;
use Modules\Superadmin\Traits\LogsSuperadminActivity;

/**
 * Service d'exécution des mises à jour legacy
 *
 * Ce service orchestre l'exécution des fichiers SQL et des classes d'action
 * legacy pour l'installation, la désinstallation et les mises à jour des modules.
 *
 * Flux d'installation complet :
 * 1. Exécuter schema.sql (tables de base)
 * 2. Exécuter chaque version dans l'ordre (1.0, 1.1, ..., 2.9)
 *
 * Flux de désinstallation complet :
 * 1. Exécuter chaque version en ordre inverse (2.9, ..., 1.1, 1.0)
 * 2. Exécuter drop.sql (suppression des tables)
 */
class LegacyUpdateRunner implements LegacyUpdateRunnerInterface
{
    use LogsSuperadminActivity;

    public function __construct(
        protected LegacyUpdateDiscoveryInterface $discovery,
        protected LegacySqlImporterInterface $sqlImporter
    ) {}

    /**
     * {@inheritdoc}
     */
    public function install(Tenant $tenant, string $moduleName): array
    {
        $report = [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'action' => 'install',
            'started_at' => now()->toIso8601String(),
            'schema' => null,
            'versions' => [],
            'final_version' => null,
            'success' => false,
            'errors' => [],
        ];

        $this->logInfo('Starting legacy module installation', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
        ]);

        try {
            // 1. Exécuter schema.sql si existe
            if ($this->discovery->hasSchemaFile($moduleName)) {
                $report['schema'] = $this->runSchema($tenant, $moduleName);
            }

            // 2. Exécuter toutes les versions
            $versionsToApply = $this->discovery->getVersionsToApply($moduleName);

            $this->logInfo('Versions to apply', [
                'module' => $moduleName,
                'versions' => $versionsToApply,
            ]);

            foreach ($versionsToApply as $version) {
                $this->logInfo("Applying version {$version}", [
                    'module' => $moduleName,
                    'version' => $version,
                ]);

                $versionResult = $this->runVersionUpgrade($tenant, $moduleName, $version);
                $report['versions'][$version] = $versionResult;

                if (!$versionResult['success']) {
                    // Collecter toutes les erreurs disponibles
                    $errorDetails = [];
                    if (!empty($versionResult['error'])) {
                        $errorDetails[] = $versionResult['error'];
                    }
                    if (!empty($versionResult['errors'])) {
                        $errorDetails = array_merge($errorDetails, $versionResult['errors']);
                    }
                    if (!empty($versionResult['action_result']['error'])) {
                        $errorDetails[] = $versionResult['action_result']['error'];
                    }

                    $errorMessage = !empty($errorDetails)
                        ? implode(' | ', $errorDetails)
                        : 'Unknown error - check logs for details';

                    $report['errors'][] = "Version {$version} failed: {$errorMessage}";

                    $this->logError("Version {$version} failed", [
                        'module' => $moduleName,
                        'version' => $version,
                        'result' => $versionResult,
                    ]);

                    throw new \RuntimeException("Failed to apply version {$version}: {$errorMessage}");
                }

                $report['final_version'] = $version;

                $this->logInfo("Version {$version} applied successfully", [
                    'module' => $moduleName,
                ]);
            }

            $report['success'] = true;
            $report['completed_at'] = now()->toIso8601String();

            $this->logInfo('Legacy module installation completed', [
                'module' => $moduleName,
                'tenant_id' => $tenant->site_id,
                'final_version' => $report['final_version'],
                'versions_applied' => count($report['versions']),
            ]);

        } catch (\Exception $e) {
            $report['success'] = false;
            $report['errors'][] = $e->getMessage();
            $report['completed_at'] = now()->toIso8601String();

            $this->logError('Legacy module installation failed', [
                'module' => $moduleName,
                'tenant_id' => $tenant->site_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $report;
    }

    /**
     * {@inheritdoc}
     */
    public function uninstall(Tenant $tenant, string $moduleName): array
    {
        $report = [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'action' => 'uninstall',
            'started_at' => now()->toIso8601String(),
            'versions' => [],
            'drop' => null,
            'success' => false,
            'errors' => [],
        ];

        $this->logInfo('Starting legacy module uninstallation', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
        ]);

        try {
            // 1. Exécuter le downgrade de toutes les versions (ordre inverse)
            $latestVersion = $this->discovery->getLatestVersion($moduleName);

            if ($latestVersion) {
                $versionsToDowngrade = $this->discovery->getVersionsToDowngrade($moduleName, $latestVersion);

                foreach ($versionsToDowngrade as $version) {
                    $versionResult = $this->runVersionDowngrade($tenant, $moduleName, $version);
                    $report['versions'][$version] = $versionResult;

                    // On continue même en cas d'erreur pour le downgrade (best effort)
                    if (!$versionResult['success']) {
                        $report['errors'][] = "Downgrade {$version} warning: " . ($versionResult['error'] ?? 'Unknown error');
                    }
                }
            }

            // 2. Exécuter drop.sql si existe
            if ($this->discovery->hasDropFile($moduleName)) {
                $report['drop'] = $this->runDrop($tenant, $moduleName);
            }

            $report['success'] = true;
            $report['completed_at'] = now()->toIso8601String();

            $this->logInfo('Legacy module uninstallation completed', [
                'module' => $moduleName,
                'tenant_id' => $tenant->site_id,
                'versions_downgraded' => count($report['versions']),
            ]);

        } catch (\Exception $e) {
            $report['success'] = false;
            $report['errors'][] = $e->getMessage();
            $report['completed_at'] = now()->toIso8601String();

            $this->logError('Legacy module uninstallation failed', [
                'module' => $moduleName,
                'tenant_id' => $tenant->site_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $report;
    }

    /**
     * {@inheritdoc}
     */
    public function upgrade(Tenant $tenant, string $moduleName, string $fromVersion, ?string $toVersion = null): array
    {
        $toVersion = $toVersion ?? $this->discovery->getLatestVersion($moduleName);

        $report = [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'action' => 'upgrade',
            'from_version' => $fromVersion,
            'to_version' => $toVersion,
            'started_at' => now()->toIso8601String(),
            'versions' => [],
            'success' => false,
            'errors' => [],
        ];

        $this->logInfo('Starting legacy module upgrade', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'from_version' => $fromVersion,
            'to_version' => $toVersion,
        ]);

        try {
            $versionsToApply = $this->discovery->getVersionsToApply($moduleName, $fromVersion, $toVersion);

            foreach ($versionsToApply as $version) {
                $versionResult = $this->runVersionUpgrade($tenant, $moduleName, $version);
                $report['versions'][$version] = $versionResult;

                if (!$versionResult['success']) {
                    $report['errors'][] = "Version {$version} failed: " . ($versionResult['error'] ?? 'Unknown error');
                    throw new \RuntimeException("Failed to apply version {$version}");
                }
            }

            $report['success'] = true;
            $report['final_version'] = $toVersion;
            $report['completed_at'] = now()->toIso8601String();

        } catch (\Exception $e) {
            $report['success'] = false;
            $report['errors'][] = $e->getMessage();
            $report['completed_at'] = now()->toIso8601String();
        }

        return $report;
    }

    /**
     * {@inheritdoc}
     */
    public function downgrade(Tenant $tenant, string $moduleName, string $fromVersion, string $toVersion): array
    {
        $report = [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'action' => 'downgrade',
            'from_version' => $fromVersion,
            'to_version' => $toVersion,
            'started_at' => now()->toIso8601String(),
            'versions' => [],
            'success' => false,
            'errors' => [],
        ];

        $this->logInfo('Starting legacy module downgrade', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'from_version' => $fromVersion,
            'to_version' => $toVersion,
        ]);

        try {
            $versionsToDowngrade = $this->discovery->getVersionsToDowngrade($moduleName, $fromVersion, $toVersion);

            foreach ($versionsToDowngrade as $version) {
                $versionResult = $this->runVersionDowngrade($tenant, $moduleName, $version);
                $report['versions'][$version] = $versionResult;

                if (!$versionResult['success']) {
                    $report['errors'][] = "Downgrade {$version} failed: " . ($versionResult['error'] ?? 'Unknown error');
                    throw new \RuntimeException("Failed to downgrade version {$version}");
                }
            }

            $report['success'] = true;
            $report['final_version'] = $toVersion;
            $report['completed_at'] = now()->toIso8601String();

        } catch (\Exception $e) {
            $report['success'] = false;
            $report['errors'][] = $e->getMessage();
            $report['completed_at'] = now()->toIso8601String();
        }

        return $report;
    }

    /**
     * {@inheritdoc}
     */
    public function runSchema(Tenant $tenant, string $moduleName): array
    {
        $schemaPath = $this->discovery->getSchemaFilePath($moduleName);

        if (!$schemaPath) {
            return [
                'success' => true,
                'skipped' => true,
                'message' => 'No schema.sql file found',
            ];
        }

        $this->logInfo('Running schema.sql', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'path' => $schemaPath,
        ]);

        try {
            $result = $this->sqlImporter->import($schemaPath, $tenant);

            return [
                'success' => $result['success'],
                'file' => $schemaPath,
                'statements' => $result['statements'],
                'errors' => $result['errors'],
            ];
        } catch (LegacySqlImportException $e) {
            return [
                'success' => false,
                'file' => $schemaPath,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * {@inheritdoc}
     */
    public function runDrop(Tenant $tenant, string $moduleName): array
    {
        $dropPath = $this->discovery->getDropFilePath($moduleName);

        if (!$dropPath) {
            return [
                'success' => true,
                'skipped' => true,
                'message' => 'No drop.sql file found',
            ];
        }

        $this->logInfo('Running drop.sql', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'path' => $dropPath,
        ]);

        try {
            $result = $this->sqlImporter->import($dropPath, $tenant);

            return [
                'success' => $result['success'],
                'file' => $dropPath,
                'statements' => $result['statements'],
                'errors' => $result['errors'],
            ];
        } catch (LegacySqlImportException $e) {
            return [
                'success' => false,
                'file' => $dropPath,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * {@inheritdoc}
     */
    public function runVersionUpgrade(Tenant $tenant, string $moduleName, string $version): array
    {
        $result = [
            'version' => $version,
            'success' => false,
            'action_executed' => false,
            'sql_executed' => false,
            'skipped' => false,
            'errors' => [],
            'warnings' => [],
        ];

        $this->logInfo('Running version upgrade', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'version' => $version,
        ]);

        try {
            $versionInfo = $this->discovery->getVersionInfo($moduleName, $version);

            // Priorité 1: Exécuter la classe d'action si elle existe
            if ($versionInfo['has_upgrade_action']) {
                $this->logInfo('Executing upgrade action class', [
                    'module' => $moduleName,
                    'version' => $version,
                    'action_path' => $versionInfo['upgrade_action_path'],
                ]);

                $actionResult = $this->executeUpgradeAction($tenant, $moduleName, $version);
                $result['action_executed'] = true;
                $result['action_result'] = $actionResult;

                if (!$actionResult['success']) {
                    $errorMsg = $actionResult['error'] ?? 'Action failed without specific error';

                    // Vérifier si l'erreur est due à des classes Symfony manquantes
                    if ($this->isLegacyClassError($errorMsg)) {
                        $this->logWarning('Action uses legacy Symfony classes, trying SQL fallback', [
                            'module' => $moduleName,
                            'version' => $version,
                            'error' => $errorMsg,
                        ]);

                        $result['warnings'][] = "Action skipped (Symfony classes): {$errorMsg}";
                        $result['action_executed'] = false;

                        // Essayer le SQL comme fallback
                        if ($versionInfo['has_upgrade_sql']) {
                            $sqlResult = $this->sqlImporter->import(
                                $versionInfo['upgrade_sql_path'],
                                $tenant
                            );
                            $result['sql_executed'] = true;
                            $result['sql_result'] = $sqlResult;

                            if ($sqlResult['success']) {
                                $result['success'] = true;
                                $result['fallback_used'] = 'sql';
                                return $result;
                            }
                        }

                        // Pas de SQL - skip gracieusement cette version
                        $result['skipped'] = true;
                        $result['success'] = true; // Skip gracieux = succès
                        $result['warnings'][] = "Version {$version} skipped: uses Symfony classes with no SQL fallback";
                        $this->logWarning('Version skipped - no SQL fallback available', [
                            'module' => $moduleName,
                            'version' => $version,
                        ]);
                        return $result;
                    }

                    // Vérifier si c'est une erreur SQL idempotente (objet existe déjà)
                    if ($this->isIdempotentSqlError($errorMsg)) {
                        $this->logWarning('Idempotent SQL error - object already exists, continuing', [
                            'module' => $moduleName,
                            'version' => $version,
                            'error' => $errorMsg,
                        ]);

                        $result['warnings'][] = "SQL skipped (already exists): {$errorMsg}";
                        $result['success'] = true;
                        $result['idempotent_skip'] = true;
                        return $result;
                    }

                    // Autre erreur - échec réel
                    $result['error'] = $errorMsg;
                    $result['errors'][] = $errorMsg;

                    $this->logError('Upgrade action failed', [
                        'module' => $moduleName,
                        'version' => $version,
                        'action_result' => $actionResult,
                    ]);

                    return $result;
                }
            }
            // Priorité 2: Sinon, exécuter le fichier SQL directement
            elseif ($versionInfo['has_upgrade_sql']) {
                $this->logInfo('Executing upgrade SQL file directly', [
                    'module' => $moduleName,
                    'version' => $version,
                    'sql_path' => $versionInfo['upgrade_sql_path'],
                ]);

                $sqlResult = $this->sqlImporter->import(
                    $versionInfo['upgrade_sql_path'],
                    $tenant
                );
                $result['sql_executed'] = true;
                $result['sql_result'] = $sqlResult;

                if (!$sqlResult['success']) {
                    $errorMsg = 'SQL import failed: ' . implode(', ', array_map(fn($e) => is_array($e) ? ($e['error'] ?? json_encode($e)) : $e, $sqlResult['errors'] ?? []));

                    // Vérifier si c'est une erreur idempotente
                    if ($this->isIdempotentSqlError($errorMsg)) {
                        $this->logWarning('Idempotent SQL error during direct import - continuing', [
                            'module' => $moduleName,
                            'version' => $version,
                            'error' => $errorMsg,
                        ]);

                        $result['warnings'][] = "SQL skipped (already exists): {$errorMsg}";
                        $result['success'] = true;
                        $result['idempotent_skip'] = true;
                        return $result;
                    }

                    $result['error'] = $errorMsg;
                    $result['errors'] = array_merge($result['errors'], $sqlResult['errors'] ?? []);

                    $this->logError('SQL import failed', [
                        'module' => $moduleName,
                        'version' => $version,
                        'sql_result' => $sqlResult,
                    ]);

                    return $result;
                }
            } else {
                // Pas d'action ni de SQL - version vide ou avec seulement des fichiers
                $this->logInfo('No upgrade action or SQL for version - skipping', [
                    'module' => $moduleName,
                    'version' => $version,
                    'version_info' => $versionInfo,
                ]);
            }

            $result['success'] = true;

        } catch (\Throwable $e) {
            $result['error'] = $e->getMessage();
            $result['errors'][] = $e->getMessage();
            $result['exception_class'] = get_class($e);
            $result['trace'] = $e->getTraceAsString();

            $this->logError('Version upgrade failed', [
                'module' => $moduleName,
                'version' => $version,
                'error' => $e->getMessage(),
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function runVersionDowngrade(Tenant $tenant, string $moduleName, string $version): array
    {
        $result = [
            'version' => $version,
            'success' => false,
            'action_executed' => false,
            'sql_executed' => false,
            'errors' => [],
        ];

        $this->logInfo('Running version downgrade', [
            'module' => $moduleName,
            'tenant_id' => $tenant->site_id,
            'version' => $version,
        ]);

        try {
            $versionInfo = $this->discovery->getVersionInfo($moduleName, $version);

            // Priorité 1: Exécuter la classe d'action downgrade si elle existe
            if ($versionInfo['has_downgrade_action']) {
                $actionResult = $this->executeDowngradeAction($tenant, $moduleName, $version);
                $result['action_executed'] = true;
                $result['action_result'] = $actionResult;

                if (!$actionResult['success']) {
                    $result['errors'][] = $actionResult['error'] ?? 'Action failed';
                    return $result;
                }
            }
            // Priorité 2: Sinon, exécuter le fichier SQL downgrade
            elseif ($versionInfo['has_downgrade_sql']) {
                $sqlResult = $this->sqlImporter->import(
                    $versionInfo['downgrade_sql_path'],
                    $tenant
                );
                $result['sql_executed'] = true;
                $result['sql_result'] = $sqlResult;

                if (!$sqlResult['success']) {
                    $result['errors'] = array_merge($result['errors'], $sqlResult['errors']);
                    return $result;
                }
            } else {
                // Pas de downgrade défini pour cette version
                $this->logInfo('No downgrade action or SQL for version', [
                    'module' => $moduleName,
                    'version' => $version,
                ]);
            }

            $result['success'] = true;

        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
            $result['errors'][] = $e->getMessage();

            $this->logError('Version downgrade failed', [
                'module' => $moduleName,
                'version' => $version,
                'error' => $e->getMessage(),
            ]);
        }

        return $result;
    }

    /**
     * Exécute une classe d'action upgrade
     */
    protected function executeUpgradeAction(Tenant $tenant, string $moduleName, string $version): array
    {
        return $this->executeLegacyAction($tenant, $moduleName, $version, 'upgrade');
    }

    /**
     * Exécute une classe d'action downgrade
     */
    protected function executeDowngradeAction(Tenant $tenant, string $moduleName, string $version): array
    {
        return $this->executeLegacyAction($tenant, $moduleName, $version, 'downgrade');
    }

    /**
     * Exécute une classe d'action legacy (upgrade ou downgrade)
     *
     * Les classes legacy étendent mfModuleUpdate (maintenant LegacyModuleUpdate)
     * et ont une méthode execute()
     */
    protected function executeLegacyAction(Tenant $tenant, string $moduleName, string $version, string $type): array
    {
        $actionPath = $type === 'upgrade'
            ? $this->discovery->getUpgradeActionPath($moduleName, $version)
            : $this->discovery->getDowngradeActionPath($moduleName, $version);

        if (!file_exists($actionPath)) {
            return [
                'success' => false,
                'error' => "Action file not found: {$actionPath}",
            ];
        }

        try {
            // Créer un adaptateur pour la classe legacy
            $adapter = new LegacyActionAdapter(
                $tenant,
                $moduleName,
                $version,
                $this->sqlImporter,
                $actionPath,
                $type
            );

            $adapter->execute();

            return [
                'success' => true,
                'executed_files' => $adapter->getExecutedFiles(),
            ];

        } catch (\Throwable $e) {
            $this->logError('Legacy action execution failed', [
                'module' => $moduleName,
                'version' => $version,
                'type' => $type,
                'error' => $e->getMessage(),
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'exception_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ];
        }
    }

    /**
     * {@inheritdoc}
     */
    public function hasLegacyUpdates(string $moduleName): bool
    {
        return $this->discovery->hasLegacyStructure($moduleName);
    }

    /**
     * {@inheritdoc}
     */
    public function getLatestVersion(string $moduleName): ?string
    {
        return $this->discovery->getLatestVersion($moduleName);
    }

    /**
     * Vérifie si l'erreur est due à des classes Symfony legacy manquantes
     *
     * Les actions legacy utilisent souvent des classes comme:
     * - PermissionGroup, Permission (système de droits Symfony)
     * - sfContext, sfConfig (framework Symfony)
     * - Propel/Doctrine models
     */
    protected function isLegacyClassError(string $error): bool
    {
        // Classes Symfony connues qui peuvent manquer
        $legacyClasses = [
            'PermissionGroup',
            'Permission',
            'sfContext',
            'sfConfig',
            'sfException',
            'Propel',
            'Criteria',
            'BasePeer',
        ];

        // Vérifier si c'est une erreur de classe non trouvée
        $isClassError = (str_contains($error, 'Class') || str_contains($error, 'class'))
            && str_contains($error, 'not found');

        if ($isClassError) {
            return true;
        }

        // Vérifier si c'est une classe legacy connue
        foreach ($legacyClasses as $class) {
            if (str_contains($error, $class)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Vérifie si l'erreur SQL est "idempotente" ou peut être ignorée
     *
     * Ces erreurs surviennent quand:
     * - schema.sql a déjà créé l'objet
     * - Une installation précédente partielle a laissé l'objet
     * - Le SQL essaie de recréer quelque chose qui existe
     * - Erreurs de données legacy (datetime invalides, etc.)
     */
    protected function isIdempotentSqlError(string $error): bool
    {
        // Patterns simples (str_contains - pas de regex)
        $simplePatterns = [
            'Duplicate foreign key constraint name',  // FK existe déjà
            'Duplicate key name',                     // Index existe déjà
            'already exists',                         // Table/colonne existe déjà
            'Duplicate column name',                  // Colonne existe déjà
            'Multiple primary key defined',           // PK existe déjà
            'check that column/key exists',           // Tentative de drop inexistant
            'check that it exists',                   // Objet n'existe pas pour DROP
            'Incorrect datetime value',               // Valeur datetime invalide (legacy)
            '0000-00-00',                             // Date zéro MySQL
            'Data truncated',                         // Données tronquées
        ];

        foreach ($simplePatterns as $pattern) {
            if (str_contains($error, $pattern)) {
                return true;
            }
        }

        // Codes d'erreur MySQL
        $mysqlErrorCodes = [
            '1061',  // Duplicate key name
            '1050',  // Table already exists
            '1060',  // Duplicate column name
            '1826',  // Duplicate foreign key constraint
            '1091',  // Can't DROP, check that exists
            '1292',  // Incorrect datetime value
            '1265',  // Data truncated
            '1366',  // Incorrect string value
        ];

        foreach ($mysqlErrorCodes as $code) {
            if (str_contains($error, $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log un warning
     */
    protected function logWarning(string $message, array $context = []): void
    {
        Log::warning("LegacyUpdateRunner: {$message}", $context);
    }
}
