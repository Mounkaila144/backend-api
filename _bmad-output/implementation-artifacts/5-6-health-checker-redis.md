# Story 5.6: Health Checker Redis

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **tester les connexions Redis (cache et queue)**,
so that **je sais si Redis est accessible**.

---

## Acceptance Criteria

1. **Given** une config Redis valide
   **When** j'appelle `check()`
   **Then** je reçois un résultat positif avec infos serveur

2. **Given** une config Redis invalide
   **When** j'appelle `check()`
   **Then** je reçois un résultat négatif avec l'erreur

---

## Tasks / Subtasks

- [x] **Task 1: Créer RedisHealthChecker** (AC: #1, #2)
  - [x] Créer `RedisHealthChecker.php`
  - [x] Tester connexion, PING, INFO

---

## Dev Notes

### RedisHealthChecker

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\Redis;
use Predis\Connection\ConnectionException;

class RedisHealthChecker implements HealthCheckerInterface
{
    public function __construct(
        protected string $serviceName = 'redis-cache',
        protected string $connection = 'cache'
    ) {}

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            $redis = Redis::connection($this->connection);

            // Test PING
            $pong = $redis->ping();

            // Get server info
            $info = $redis->info();

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Redis connection successful',
                details: [
                    'version' => $info['redis_version'] ?? 'Unknown',
                    'connected_clients' => $info['connected_clients'] ?? 0,
                    'used_memory_human' => $info['used_memory_human'] ?? 'Unknown',
                    'uptime_in_days' => $info['uptime_in_days'] ?? 0,
                ],
                latencyMs: $latency
            );

        } catch (ConnectionException $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Redis connection failed: ' . $e->getMessage(),
                details: [],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Redis error: ' . $e->getMessage(),
                details: [],
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
```

### Usage

```php
// Dans le controller
$cacheChecker = RedisHealthChecker::forCache();
$queueChecker = RedisHealthChecker::forQueue();

$cacheResult = $cacheChecker->check();
$queueResult = $queueChecker->check();
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR53, FR54, FR58, FR59]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.6]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé RedisHealthChecker pour tester les connexions Redis
- Supporte cache et queue via factory methods (forCache, forQueue)
- Teste PING et récupère les infos serveur (version, clients connectés, mémoire, uptime)
- Mesure la latence de connexion

### File List
- Modules/Superadmin/Services/Checkers/RedisHealthChecker.php (new)

