# Story 5.11: Health Checker Meilisearch

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **tester la connexion Meilisearch**,
so that **je sais si la recherche fonctionne**.

---

## Acceptance Criteria

1. **Given** une config Meilisearch valide
   **When** j'appelle `check()`
   **Then** je reçois un résultat positif

2. **Given** une config Meilisearch invalide
   **When** j'appelle `check()`
   **Then** je reçois un résultat négatif

---

## Tasks / Subtasks

- [x] **Task 1: Créer MeilisearchHealthChecker** (AC: #1, #2)
  - [x] Tester la connexion
  - [x] Vérifier la santé du serveur

---

## Dev Notes

### MeilisearchHealthChecker

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\Http;

class MeilisearchHealthChecker implements HealthCheckerInterface
{
    protected string $serviceName = 'meilisearch';

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            $config = $config ?? $this->getConfig();

            if (!$config) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'No Meilisearch configuration found',
                    details: []
                );
            }

            $url = rtrim($config['url'], '/');
            $apiKey = $config['api_key'];

            // Check health endpoint
            $healthResponse = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(10)->get("{$url}/health");

            if (!$healthResponse->successful()) {
                throw new \Exception('Health check failed: ' . $healthResponse->status());
            }

            // Get version info
            $versionResponse = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(10)->get("{$url}/version");

            $version = $versionResponse->json();

            // Get stats
            $statsResponse = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(10)->get("{$url}/stats");

            $stats = $statsResponse->json();

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Meilisearch connection successful',
                details: [
                    'url' => $url,
                    'version' => $version['pkgVersion'] ?? 'Unknown',
                    'database_size' => $stats['databaseSize'] ?? 0,
                    'indexes_count' => count($stats['indexes'] ?? []),
                ],
                latencyMs: $latency
            );

        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Meilisearch error: ' . $e->getMessage(),
                details: [],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        }
    }

    protected function getConfig(): ?array
    {
        return app(ServiceConfigManager::class)->get('meilisearch');
    }
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR68, FR69]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.11]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé MeilisearchHealthChecker pour tester la connexion Meilisearch
- Vérifie le health endpoint, récupère la version et les stats
- Affiche la taille de la DB et le nombre d'index
- Mesure la latence de connexion

### File List
- Modules/Superadmin/Services/Checkers/MeilisearchHealthChecker.php (new)

