# Story 6.5: Cache des Health Checks

**Status:** ready-for-dev

---

## Story

As a **SuperAdmin**,
I want **que les résultats de health check soient cachés brièvement**,
so that **les appels répétés ne surchargent pas les services**.

---

## Acceptance Criteria

1. **Given** un health check récent (< 30 secondes)
   **When** j'appelle à nouveau `GET /api/superadmin/health`
   **Then** le résultat caché est retourné
   **And** le header `X-Cache-Status: HIT` est présent

2. **Given** un health check périmé (> 30 secondes)
   **When** j'appelle l'endpoint
   **Then** un nouveau check est exécuté
   **And** le résultat est mis en cache

3. **Given** j'appelle `POST /api/superadmin/health/test-all`
   **When** le test est exécuté
   **Then** le cache est invalidé et rafraîchi

---

## Tasks / Subtasks

- [x] **Task 1: Implémenter le cache dans HealthController** (AC: #1, #2)
  - [x] Cache TTL de 30 secondes
  - [x] Header X-Cache-Status

- [x] **Task 2: Invalider le cache lors du test-all** (AC: #3)
  - [x] Cache::forget avant de retourner les résultats

---

## Dev Notes

### HealthController avec Cache

```php
<?php

namespace Modules\Superadmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Superadmin\Services\ServiceHealthChecker;
use Modules\Superadmin\Http\Resources\HealthCheckResource;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    protected const CACHE_KEY = 'health:all';
    protected const CACHE_TTL = 30; // secondes

    public function __construct(
        protected ServiceHealthChecker $healthChecker
    ) {}

    /**
     * GET /api/superadmin/health
     * Dashboard santé global avec cache
     */
    public function index(): JsonResponse
    {
        $cacheHit = Cache::has(self::CACHE_KEY);

        $results = Cache::remember(
            self::CACHE_KEY,
            self::CACHE_TTL,
            fn () => $this->healthChecker->checkAll()
        );

        return response()
            ->json([
                'data' => new HealthCheckResource($results),
            ])
            ->header('X-Cache-Status', $cacheHit ? 'HIT' : 'MISS')
            ->header('X-Cache-TTL', self::CACHE_TTL);
    }

    /**
     * POST /api/superadmin/health/test-all
     * Test complet de connectivité - invalide le cache
     */
    public function testAll(): JsonResponse
    {
        $startTime = microtime(true);

        // Exécuter les tests complets
        $results = $this->healthChecker->testAll(fullTest: true);

        // Invalider et rafraîchir le cache
        Cache::forget(self::CACHE_KEY);
        Cache::put(self::CACHE_KEY, $results, self::CACHE_TTL);

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

        return response()
            ->json([
                'data' => new HealthCheckResource($results),
                'meta' => [
                    'fullTest' => true,
                    'totalTimeMs' => round((microtime(true) - $startTime) * 1000, 2),
                ],
            ])
            ->header('X-Cache-Status', 'REFRESH');
    }

    /**
     * POST /api/superadmin/health/refresh
     * Force un rafraîchissement du cache
     */
    public function refresh(): JsonResponse
    {
        Cache::forget(self::CACHE_KEY);

        $results = $this->healthChecker->checkAll();
        Cache::put(self::CACHE_KEY, $results, self::CACHE_TTL);

        return response()
            ->json([
                'data' => new HealthCheckResource($results),
            ])
            ->header('X-Cache-Status', 'REFRESH');
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

### Headers de Réponse

| Header | Valeur | Description |
|--------|--------|-------------|
| `X-Cache-Status` | `HIT` | Résultat servi depuis le cache |
| `X-Cache-Status` | `MISS` | Nouveau check effectué, mis en cache |
| `X-Cache-Status` | `REFRESH` | Cache invalidé et rafraîchi |
| `X-Cache-TTL` | `30` | Durée de vie du cache en secondes |

### Routes

```php
// Dans Modules/Superadmin/Routes/superadmin.php
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'index'])
        ->middleware('throttle:superadmin-read');
    Route::post('/test-all', [HealthController::class, 'testAll'])
        ->middleware('throttle:superadmin-heavy');
    Route::post('/refresh', [HealthController::class, 'refresh'])
        ->middleware('throttle:superadmin-write');
});
```

### Configuration Cache TTL

```php
// config/health-thresholds.php
return [
    'cache' => [
        'ttl' => env('HEALTH_CACHE_TTL', 30), // 30 secondes par défaut
    ],

    'latency' => [
        // ... seuils existants
    ],
];
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#NFRs - NFR-P4]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.5]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Implémenté cache dans HealthController avec TTL de 30 secondes
- ✅ Ajouté headers X-Cache-Status (HIT/MISS/REFRESH) et X-Cache-TTL
- ✅ Cache::remember() dans index() pour servir les résultats cachés
- ✅ Invalidation du cache dans testAll() avant de rafraîchir
- ✅ Ajouté méthode refresh() pour forcer un rafraîchissement manuel
- ✅ Ajouté route POST /api/superadmin/health/refresh
- ✅ Configuration cache.ttl dans health-thresholds.php (env HEALTH_CACHE_TTL)

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/HealthController.php
- Modules/Superadmin/Routes/superadmin.php
- config/health-thresholds.php

## Change Log
- 2026-01-28: Ajout du cache des health checks avec TTL 30s et headers X-Cache-Status

## Status
**review**
