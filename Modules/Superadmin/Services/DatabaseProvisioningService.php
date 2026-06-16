<?php

namespace Modules\Superadmin\Services;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Provisionnement de DB tenants : test connexion + création.
 *
 * Utilise PDO directement (pas le facade DB) parce qu'on se connecte avec
 * des credentials arbitraires fournis par l'UI superadmin.
 *
 * L'import de dumps SQL est délégué à phpMyAdmin (déployé séparément dans
 * Railway / le même cloud que la DB) — le réseau interne est beaucoup plus
 * rapide qu'un upload via notre API.
 */
class DatabaseProvisioningService
{
    /**
     * Vérifie qu'on peut joindre le serveur MySQL et indique si la DB existe.
     *
     * @return array{can_connect: bool, server_version?: string, db_exists?: bool, error?: string}
     */
    public function testConnection(string $host, int $port, string $username, string $password, ?string $database = null): array
    {
        try {
            $pdo = $this->connect($host, $port, $username, $password);
            $version = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);

            $result = [
                'can_connect'    => true,
                'server_version' => $version,
            ];

            if ($database !== null && $database !== '') {
                $result['db_exists'] = $this->databaseExists($pdo, $database);
            }

            return $result;
        } catch (PDOException $e) {
            return [
                'can_connect' => false,
                'error'       => $this->sanitizeError($e->getMessage()),
            ];
        }
    }

    /**
     * Crée la DB si absente. Idempotent.
     *
     * @return array{created: bool, already_existed: bool}
     */
    public function provisionDatabase(string $host, int $port, string $username, string $password, string $database): array
    {
        $this->assertSafeIdentifier($database);

        $pdo = $this->connect($host, $port, $username, $password);

        if ($this->databaseExists($pdo, $database)) {
            return ['created' => false, 'already_existed' => true];
        }

        // Identifier déjà validé par assertSafeIdentifier — backticks pour le quoting MySQL.
        $pdo->exec(sprintf(
            'CREATE DATABASE `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            $database
        ));

        return ['created' => true, 'already_existed' => false];
    }

    /**

    /**
     * Vérifie l'existence de la DB. Pas de prepared statement : certains proxys
     * SQL (Railway entre autres) renvoient un "syntax error near '?'" même en
     * mode emulated. Le `$database` étant déjà validé par `assertSafeIdentifier`
     * (regex stricte alphanumérique), l'interpolation est sûre.
     */
    private function databaseExists(PDO $pdo, string $database): bool
    {
        $this->assertSafeIdentifier($database);

        $sql = sprintf(
            "SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = %s LIMIT 1",
            $pdo->quote($database)
        );

        return (bool) $pdo->query($sql)->fetchColumn();
    }

    /**
     * PDO sans DB précisée — utile pour SHOW DATABASES / CREATE DATABASE.
     */
    private function connect(string $host, int $port, string $username, string $password): PDO
    {
        $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $host, $port);

        return new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE          => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT          => 5,
            // Emulated = true : substitution client (le serveur reçoit la requête déjà
            // remplacée). Nécessaire pour traverser les proxys SQL (ex: Railway TCP
            // proxy) qui ne supportent pas les binds binaires natifs MySQL.
            PDO::ATTR_EMULATE_PREPARES => true,
        ]);
    }

    /**
     * Empêche l'injection SQL via le nom de DB (utilisé en interpolation
     * dans `CREATE DATABASE`, où PDO ne supporte pas les bindings).
     */
    private function assertSafeIdentifier(string $name): void
    {
        if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $name)) {
            throw new RuntimeException(
                "Nom de DB invalide : seuls [a-zA-Z0-9_] sont autorisés (max 64 caractères)."
            );
        }
    }

    /**
     * Évite de faire fuiter le mot de passe dans les messages d'erreur PDO
     * (certains drivers les incluent dans le DSN).
     */
    private function sanitizeError(string $message): string
    {
        return preg_replace('/password=[^;\s]+/', 'password=***', $message);
    }
}
