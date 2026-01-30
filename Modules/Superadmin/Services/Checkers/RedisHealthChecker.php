<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Redis;

class RedisHealthChecker implements HealthCheckerInterface
{
    public function __construct(
        protected string $serviceName = 'redis-cache',
        protected string $connection = 'cache'
    ) {
    }

    /**
     * Crée une connexion Redis dynamique avec la configuration fournie
     */
    protected function createDynamicConnection(array $config): mixed
    {
        $connectionName = 'dynamic_test_' . uniqid();

        $connectionConfig = [];

        // Si SSL/TLS est activé, utiliser une URL au lieu de host/port séparés
        // Cela est nécessaire pour Upstash et autres services cloud
        if (!empty($config['ssl']) || !empty($config['tls'])) {
            // Construire l'URL rediss:// (Redis avec SSL)
            $scheme = 'rediss';
            $host = $config['host'] ?? '127.0.0.1';
            $port = (int) ($config['port'] ?? 6379);
            $password = $config['password'] ?? null;
            $database = (int) ($config['database'] ?? 0);

            // Format: rediss://[:password@]host[:port][/database]
            if ($password) {
                $url = "{$scheme}://default:{$password}@{$host}:{$port}/{$database}";
            } else {
                $url = "{$scheme}://{$host}:{$port}/{$database}";
            }

            $connectionConfig['url'] = $url;
            $connectionConfig['prefix'] = $config['prefix'] ?? '';
            $connectionConfig['timeout'] = 10;
            $connectionConfig['read_timeout'] = 30;

            // Options SSL pour phpredis
            $connectionConfig['context'] = [
                'stream' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
            ];
        } else {
            // Configuration standard sans SSL
            $connectionConfig = [
                'host' => $config['host'] ?? '127.0.0.1',
                'port' => (int) ($config['port'] ?? 6379),
                'password' => $config['password'] ?? null,
                'database' => (int) ($config['database'] ?? 0),
                'prefix' => $config['prefix'] ?? '',
                'read_timeout' => 30,
                'timeout' => 10,
            ];
        }

        // Configurer une connexion temporaire
        Config::set("database.redis.{$connectionName}", $connectionConfig);

        return Redis::connection($connectionName);
    }

    /**
     * Extrait une valeur de façon sécurisée depuis les infos Redis
     */
    protected function extractInfoValue(array $info, string $key, string $section = null, $default = 'Unknown'): mixed
    {
        // Essayer directement
        if (isset($info[$key])) {
            return $this->sanitizeValue($info[$key]);
        }

        // Essayer avec la section
        if ($section && isset($info[$section][$key])) {
            return $this->sanitizeValue($info[$section][$key]);
        }

        return $default;
    }

    /**
     * Nettoie une valeur pour l'encodage UTF-8
     */
    protected function sanitizeValue(mixed $value): mixed
    {
        if (is_string($value)) {
            // Convertir en UTF-8 si nécessaire
            $encoded = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
            // Supprimer les caractères non imprimables
            return preg_replace('/[^\x20-\x7E\x{00A0}-\x{FFFF}]/u', '', $encoded) ?: $value;
        }

        return $value;
    }

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            // Si une config est fournie, créer une connexion dynamique
            // Sinon utiliser la connexion Laravel par défaut
            if ($config && !empty($config['host'])) {
                $redis = $this->createDynamicConnection($config);
            } else {
                $redis = Redis::connection($this->connection);
            }

            // Test PING
            $pong = $redis->ping();

            $latency = (microtime(true) - $startTime) * 1000;

            // Essayer de récupérer les infos serveur (optionnel)
            $details = [
                'host' => $config['host'] ?? 'default',
                'port' => $config['port'] ?? 'default',
            ];

            try {
                $info = $redis->info();
                if (is_array($info)) {
                    $details['version'] = $this->extractInfoValue($info, 'redis_version', 'Server');
                    $details['connected_clients'] = $this->extractInfoValue($info, 'connected_clients', 'Clients', 0);
                    $details['used_memory_human'] = $this->extractInfoValue($info, 'used_memory_human', 'Memory');
                    $details['uptime_in_days'] = $this->extractInfoValue($info, 'uptime_in_days', 'Server', 0);
                }
            } catch (\Exception $infoException) {
                // Ignorer les erreurs de info(), le PING a réussi
                $details['info_error'] = 'Could not retrieve server info';
            }

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Redis connection successful',
                details: $details,
                latencyMs: $latency
            );

        } catch (\RedisException $e) {
            $details = [
                'host' => $config['host'] ?? 'default',
                'port' => $config['port'] ?? 'default',
                'ssl_enabled' => !empty($config['ssl']) || !empty($config['tls']),
                'error_type' => 'RedisException',
            ];

            // Ajouter des informations de diagnostic SSL
            if (!empty($config['ssl']) || !empty($config['tls'])) {
                $details['ssl_info'] = 'Using rediss:// connection URL';
                $details['phpredis_version'] = phpversion('redis') ?: 'unknown';
            }

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Redis connection failed: '.$this->sanitizeValue($e->getMessage()),
                details: $details,
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        } catch (\Exception $e) {
            $details = [
                'host' => $config['host'] ?? 'default',
                'port' => $config['port'] ?? 'default',
                'ssl_enabled' => !empty($config['ssl']) || !empty($config['tls']),
                'error_type' => get_class($e),
            ];

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Redis error: '.$this->sanitizeValue($e->getMessage()),
                details: $details,
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        }
    }

    public function fullTest(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            // Si une config est fournie, créer une connexion dynamique
            // Sinon utiliser la connexion Laravel par défaut
            if ($config && !empty($config['host'])) {
                $redis = $this->createDynamicConnection($config);
            } else {
                $redis = Redis::connection($this->connection);
            }

            $testKey = 'health_check_'.uniqid();
            $testValue = 'test_'.time();

            // Set test
            $redis->set($testKey, $testValue, 'EX', 60);

            // Get test
            $retrieved = $redis->get($testKey);

            if ($retrieved !== $testValue) {
                throw new \Exception('Value mismatch after get');
            }

            // Delete test
            $redis->del($testKey);

            // Verify deletion
            if ($redis->exists($testKey)) {
                throw new \Exception('Key not deleted');
            }

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Full Redis test passed (set/get/del)',
                details: [
                    'operations' => ['set', 'get', 'del'],
                    'host' => $config['host'] ?? 'default',
                    'port' => $config['port'] ?? 'default',
                ],
                latencyMs: $latency
            );

        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Redis full test failed: '.$e->getMessage(),
                details: [
                    'host' => $config['host'] ?? 'default',
                    'port' => $config['port'] ?? 'default',
                ],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        }
    }

    /**
     * Factory pour Redis Cache
     */
    public static function forCache(): self
    {
        return new self('redis-cache', 'cache');
    }

    /**
     * Factory pour Redis Queue
     */
    public static function forQueue(): self
    {
        return new self('redis-queue', 'queue');
    }
}
