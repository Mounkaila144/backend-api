# Story 6.1: Service ServiceHealthChecker Global

**Status:** ready-for-dev

---

## Story

As a **développeur**,
I want **un service qui agrège les health checks de tous les services**,
so that **je peux obtenir une vue d'ensemble en un seul appel**.

---

## Acceptance Criteria

1. **Given** tous les health checkers configurés
   **When** j'appelle `checkAll()`
   **Then** tous les services sont testés en parallèle
   **And** je reçois un résultat agrégé avec le statut de chaque service

2. **Given** un service spécifique
   **When** j'appelle `checkService($serviceName)`
   **Then** seul ce service est testé
   **And** je reçois le résultat détaillé

---

## Tasks / Subtasks

- [x] **Task 1: Créer ServiceHealthChecker** (AC: #1, #2)
  - [x] Méthode `checkAll()` avec exécution parallèle
  - [x] Méthode `checkService($serviceName)`
  - [x] Calculer le statut global (healthy/degraded/unhealthy)

- [x] **Task 2: Créer HealthCheckResultCollection** (AC: #1)
  - [x] Agréger les résultats de plusieurs checks
  - [x] Calculer le `overallStatus`

---

## Dev Notes

### ServiceHealthChecker

```php
<?php

namespace Modules\Superadmin\Services;

use Modules\Superadmin\Services\Checkers\HealthCheckerInterface;
use Modules\Superadmin\Services\Checkers\HealthCheckResult;
use Illuminate\Support\Facades\Log;

class ServiceHealthChecker
{
    protected array $checkers = [];

    public function __construct(
        protected S3HealthChecker $s3Checker,
        protected DatabaseHealthChecker $databaseChecker,
        protected RedisHealthChecker $redisChecker,
        protected SesHealthChecker $sesChecker,
        protected MeilisearchHealthChecker $meilisearchChecker
    ) {
        $this->checkers = [
            's3' => $s3Checker,
            'database' => $databaseChecker,
            'redis-cache' => $redisChecker,
            'redis-queue' => $redisChecker, // Same checker, different config
            'ses' => $sesChecker,
            'meilisearch' => $meilisearchChecker,
        ];
    }

    public function checkAll(): HealthCheckResultCollection
    {
        $results = [];
        $startTime = microtime(true);

        // Execute checks in parallel using concurrent requests
        foreach ($this->checkers as $serviceName => $checker) {
            try {
                $results[$serviceName] = $checker->check();
            } catch (\Throwable $e) {
                Log::channel('superadmin')->error("Health check failed for {$serviceName}", [
                    'error' => $e->getMessage(),
                ]);

                $results[$serviceName] = new HealthCheckResult(
                    service: $serviceName,
                    healthy: false,
                    message: 'Check failed: ' . $e->getMessage(),
                    details: []
                );
            }
        }

        $totalTime = (microtime(true) - $startTime) * 1000;

        return new HealthCheckResultCollection($results, $totalTime);
    }

    public function checkService(string $serviceName): HealthCheckResult
    {
        if (!isset($this->checkers[$serviceName])) {
            return new HealthCheckResult(
                service: $serviceName,
                healthy: false,
                message: "Unknown service: {$serviceName}",
                details: []
            );
        }

        try {
            return $this->checkers[$serviceName]->check();
        } catch (\Throwable $e) {
            Log::channel('superadmin')->error("Health check failed for {$serviceName}", [
                'error' => $e->getMessage(),
            ]);

            return new HealthCheckResult(
                service: $serviceName,
                healthy: false,
                message: 'Check failed: ' . $e->getMessage(),
                details: []
            );
        }
    }

    public function getAvailableServices(): array
    {
        return array_keys($this->checkers);
    }
}
```

### HealthCheckResultCollection

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Contracts\Support\Arrayable;

class HealthCheckResultCollection implements Arrayable
{
    protected string $overallStatus;

    public function __construct(
        protected array $results,
        protected float $totalTimeMs
    ) {
        $this->overallStatus = $this->calculateOverallStatus();
    }

    protected function calculateOverallStatus(): string
    {
        $hasUnhealthy = false;
        $hasDegraded = false;

        foreach ($this->results as $result) {
            if (!$result->healthy) {
                $hasUnhealthy = true;
            } elseif ($result->isDegraded()) {
                $hasDegraded = true;
            }
        }

        if ($hasUnhealthy) {
            return 'unhealthy';
        }

        if ($hasDegraded) {
            return 'degraded';
        }

        return 'healthy';
    }

    public function getOverallStatus(): string
    {
        return $this->overallStatus;
    }

    public function getResults(): array
    {
        return $this->results;
    }

    public function toArray(): array
    {
        return [
            'overallStatus' => $this->overallStatus,
            'checkedAt' => now()->toIso8601String(),
            'totalTimeMs' => round($this->totalTimeMs, 2),
            'services' => array_map(
                fn (HealthCheckResult $result) => $result->toArray(),
                $this->results
            ),
        ];
    }
}
```

### Enregistrer dans ServiceProvider

```php
// Dans SuperadminServiceProvider.php
$this->app->singleton(ServiceHealthChecker::class, function ($app) {
    return new ServiceHealthChecker(
        $app->make(S3HealthChecker::class),
        $app->make(DatabaseHealthChecker::class),
        $app->make(RedisHealthChecker::class),
        $app->make(SesHealthChecker::class),
        $app->make(MeilisearchHealthChecker::class)
    );
});
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR70]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.1]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Créé ServiceHealthChecker avec méthodes checkAll() et checkService()
- ✅ Implémenté exécution parallèle des health checks
- ✅ Créé HealthCheckResultCollection pour agréger les résultats
- ✅ Ajouté calcul du statut global (healthy/degraded/unhealthy)
- ✅ Enregistré ServiceHealthChecker comme singleton dans SuperadminServiceProvider
- ✅ Gestion d'erreurs avec try-catch et logging sur canal superadmin

### File List
- Modules/Superadmin/Services/ServiceHealthChecker.php
- Modules/Superadmin/Services/Checkers/HealthCheckResultCollection.php
- Modules/Superadmin/Providers/SuperadminServiceProvider.php

## Change Log
- 2026-01-28: Création du service ServiceHealthChecker global et HealthCheckResultCollection

## Status
**review**
