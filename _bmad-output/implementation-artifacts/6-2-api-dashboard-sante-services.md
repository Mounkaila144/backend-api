# Story 6.2: API Dashboard Santé Services

**Status:** ready-for-dev

---

## Story

As a **SuperAdmin**,
I want **un endpoint pour voir l'état de santé de tous les services**,
so that **je peux surveiller l'infrastructure en un coup d'œil**.

---

## Acceptance Criteria

1. **Given** je suis authentifié avec le rôle superadmin
   **When** j'appelle `GET /api/superadmin/health`
   **Then** je reçois une réponse 200 avec le statut de tous les services

2. **Given** la réponse
   **Then** `overallStatus` est:
   - "healthy" si tous les services sont healthy
   - "degraded" si au moins un service est degraded
   - "unhealthy" si au moins un service est unhealthy

---

## Tasks / Subtasks

- [x] **Task 1: Créer HealthController** (AC: #1, #2)
  - [x] Méthode `index()` pour GET /health
  - [x] Utiliser ServiceHealthChecker

- [x] **Task 2: Créer HealthCheckResource** (AC: #1)
  - [x] Transformation camelCase des données
  - [x] Format de réponse standardisé

- [x] **Task 3: Ajouter les routes** (AC: #1)
  - [x] Route GET /api/superadmin/health
  - [x] Middleware throttle:superadmin-read

---

## Dev Notes

### HealthController

```php
<?php

namespace Modules\Superadmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Superadmin\Services\ServiceHealthChecker;
use Modules\Superadmin\Http\Resources\HealthCheckResource;

class HealthController extends Controller
{
    public function __construct(
        protected ServiceHealthChecker $healthChecker
    ) {}

    /**
     * GET /api/superadmin/health
     * Dashboard santé global
     */
    public function index(): JsonResponse
    {
        $results = $this->healthChecker->checkAll();

        return response()->json([
            'data' => new HealthCheckResource($results),
        ]);
    }
}
```

### HealthCheckResource

```php
<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HealthCheckResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'overallStatus' => $this->resource->getOverallStatus(),
            'checkedAt' => now()->toIso8601String(),
            'services' => collect($this->resource->getResults())->map(function ($result) {
                return [
                    'name' => $result->service,
                    'status' => $this->getStatus($result),
                    'latencyMs' => $result->latencyMs,
                    'message' => $result->message ?? null,
                ];
            })->values(),
        ];
    }

    protected function getStatus($result): string
    {
        if (!$result->healthy) {
            return 'unhealthy';
        }

        if ($result->isDegraded()) {
            return 'degraded';
        }

        return 'healthy';
    }
}
```

### Routes

```php
// Dans Modules/Superadmin/Routes/superadmin.php
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'index'])
        ->middleware('throttle:superadmin-read');
});
```

### Exemple de Réponse

```json
{
  "data": {
    "overallStatus": "healthy",
    "checkedAt": "2026-01-27T10:30:00Z",
    "services": [
      {
        "name": "s3",
        "status": "healthy",
        "latencyMs": 45,
        "message": null
      },
      {
        "name": "database",
        "status": "healthy",
        "latencyMs": 12,
        "message": null
      },
      {
        "name": "redis-cache",
        "status": "healthy",
        "latencyMs": 3,
        "message": null
      },
      {
        "name": "redis-queue",
        "status": "healthy",
        "latencyMs": 4,
        "message": null
      },
      {
        "name": "ses",
        "status": "degraded",
        "latencyMs": 890,
        "message": "High latency detected"
      },
      {
        "name": "meilisearch",
        "status": "unhealthy",
        "latencyMs": null,
        "message": "Connection refused"
      }
    ]
  }
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR70, FR71]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.2]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Créé HealthController avec méthode index() pour GET /api/superadmin/health
- ✅ Créé HealthCheckResource pour transformation des données en camelCase
- ✅ Ajouté détection automatique du statut degraded basé sur latence > 500ms
- ✅ Ajouté route GET /api/superadmin/health avec middleware throttle:superadmin-read
- ✅ Format de réponse standardisé avec overallStatus, checkedAt, et liste des services

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/HealthController.php
- Modules/Superadmin/Http/Resources/HealthCheckResource.php
- Modules/Superadmin/Routes/superadmin.php

## Change Log
- 2026-01-28: Création de l'API dashboard santé services avec HealthController et HealthCheckResource

## Status
**review**
