# Story 6.3: API Test Global de Connectivité

**Status:** ready-for-dev

---

## Story

As a **SuperAdmin**,
I want **lancer un test de connectivité global en un clic**,
so that **je peux vérifier rapidement que tout fonctionne**.

---

## Acceptance Criteria

1. **Given** je suis authentifié avec le rôle superadmin
   **When** j'appelle `POST /api/superadmin/health/test-all`
   **Then** tous les services sont testés avec des opérations complètes

2. **Given** les tests sont exécutés
   **Then** chaque service effectue:
   - S3: write/read/delete test file
   - Database: query execution
   - Redis: set/get/del test key
   - SES: credential validation
   - Meilisearch: index listing

3. **Given** le temps de réponse
   **Then** le temps total est < 30 secondes

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter méthode testAll dans HealthController** (AC: #1, #2)
  - [x] Exécuter des tests complets pour chaque service
  - [x] Retourner le résultat détaillé

- [x] **Task 2: Ajouter les tests complets dans les checkers** (AC: #2)
  - [x] S3: write/read/delete
  - [x] Redis: set/get/del
  - [x] Autres: tests standards

- [x] **Task 3: Ajouter la route** (AC: #1)
  - [x] Route POST /api/superadmin/health/test-all
  - [x] Middleware throttle:superadmin-heavy

---

## Dev Notes

### HealthController - testAll

```php
<?php

namespace Modules\Superadmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Superadmin\Services\ServiceHealthChecker;
use Modules\Superadmin\Http\Resources\HealthCheckResource;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    public function __construct(
        protected ServiceHealthChecker $healthChecker
    ) {}

    /**
     * POST /api/superadmin/health/test-all
     * Test complet de connectivité
     */
    public function testAll(): JsonResponse
    {
        $startTime = microtime(true);

        // Exécuter les tests complets (avec opérations write/read/delete)
        $results = $this->healthChecker->testAll(fullTest: true);

        // Invalider le cache des health checks
        Cache::forget('health:all');

        // Logger le test manuel
        activity('superadmin')
            ->causedBy(auth()->id())
            ->withProperties([
                'action' => 'health.test_all',
                'overall_status' => $results->getOverallStatus(),
                'services_tested' => count($results->getResults()),
                'failed_services' => $this->getFailedServices($results),
                'total_time_ms' => round((microtime(true) - $startTime) * 1000, 2),
            ])
            ->log('Health check performed');

        return response()->json([
            'data' => new HealthCheckResource($results),
            'meta' => [
                'fullTest' => true,
                'totalTimeMs' => round((microtime(true) - $startTime) * 1000, 2),
            ],
        ]);
    }

    protected function getFailedServices($results): array
    {
        $failed = [];
        foreach ($results->getResults() as $result) {
            if (!$result->healthy) {
                $failed[] = $result->service;
            }
        }
        return $failed;
    }
}
```

### Tests Complets pour S3

```php
<?php

// Dans S3HealthChecker
public function fullTest(?array $config = null): HealthCheckResult
{
    $startTime = microtime(true);

    try {
        $config = $config ?? $this->getConfig();
        $client = $this->createClient($config);
        $bucket = $config['bucket'];
        $testKey = 'health-check/' . uniqid('test_', true) . '.txt';
        $testContent = 'Health check test at ' . now()->toIso8601String();

        // Write test
        $client->putObject([
            'Bucket' => $bucket,
            'Key' => $testKey,
            'Body' => $testContent,
        ]);

        // Read test
        $result = $client->getObject([
            'Bucket' => $bucket,
            'Key' => $testKey,
        ]);

        $readContent = (string) $result['Body'];

        if ($readContent !== $testContent) {
            throw new \Exception('Content mismatch after read');
        }

        // Delete test
        $client->deleteObject([
            'Bucket' => $bucket,
            'Key' => $testKey,
        ]);

        $latency = (microtime(true) - $startTime) * 1000;

        return new HealthCheckResult(
            service: $this->serviceName,
            healthy: true,
            message: 'Full S3 test passed (write/read/delete)',
            details: [
                'bucket' => $bucket,
                'operations' => ['put', 'get', 'delete'],
            ],
            latencyMs: $latency
        );

    } catch (\Exception $e) {
        return new HealthCheckResult(
            service: $this->serviceName,
            healthy: false,
            message: 'S3 full test failed: ' . $e->getMessage(),
            details: [],
            latencyMs: (microtime(true) - $startTime) * 1000
        );
    }
}
```

### Tests Complets pour Redis

```php
<?php

// Dans RedisHealthChecker
public function fullTest(?array $config = null): HealthCheckResult
{
    $startTime = microtime(true);

    try {
        $testKey = 'health_check_' . uniqid();
        $testValue = 'test_' . time();

        // Set test
        Cache::put($testKey, $testValue, 60);

        // Get test
        $retrieved = Cache::get($testKey);

        if ($retrieved !== $testValue) {
            throw new \Exception('Value mismatch after get');
        }

        // Delete test
        Cache::forget($testKey);

        // Verify deletion
        if (Cache::has($testKey)) {
            throw new \Exception('Key not deleted');
        }

        $latency = (microtime(true) - $startTime) * 1000;

        return new HealthCheckResult(
            service: $this->serviceName,
            healthy: true,
            message: 'Full Redis test passed (set/get/del)',
            details: [
                'operations' => ['set', 'get', 'del'],
            ],
            latencyMs: $latency
        );

    } catch (\Exception $e) {
        return new HealthCheckResult(
            service: $this->serviceName,
            healthy: false,
            message: 'Redis full test failed: ' . $e->getMessage(),
            details: [],
            latencyMs: (microtime(true) - $startTime) * 1000
        );
    }
}
```

### Routes

```php
// Dans Modules/Superadmin/Routes/superadmin.php
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'index'])
        ->middleware('throttle:superadmin-read');
    Route::post('/test-all', [HealthController::class, 'testAll'])
        ->middleware('throttle:superadmin-heavy');
});
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR71, FR72]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.3]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Ajouté méthode testAll() dans ServiceHealthChecker pour exécuter les tests complets
- ✅ Ajouté méthode fullTest() dans S3HealthChecker avec write/read/delete et vérification de contenu
- ✅ Ajouté méthode fullTest() dans RedisHealthChecker avec set/get/del et vérification
- ✅ Ajouté méthode testAll() dans HealthController avec mesure de temps total
- ✅ Ajouté route POST /api/superadmin/health/test-all avec middleware throttle:superadmin-heavy
- ✅ Fallback automatique vers check() pour les checkers sans fullTest()

### File List
- Modules/Superadmin/Services/ServiceHealthChecker.php
- Modules/Superadmin/Services/Checkers/S3HealthChecker.php
- Modules/Superadmin/Services/Checkers/RedisHealthChecker.php
- Modules/Superadmin/Http/Controllers/Superadmin/HealthController.php
- Modules/Superadmin/Routes/superadmin.php

## Change Log
- 2026-01-28: Ajout de l'API de test global de connectivité avec opérations complètes

## Status
**review**
