# Story 6.7: Audit Trail Health Checks

**Status:** ready-for-dev

---

## Story

As a **SuperAdmin**,
I want **que les tests de santé manuels soient enregistrés**,
so that **je peux voir l'historique des vérifications**.

---

## Acceptance Criteria

1. **Given** un test de santé global lancé manuellement
   **When** le test est terminé
   **Then** un enregistrement est créé dans activity_log avec:
   - description: 'Health check performed'
   - properties: résultat global, services en erreur

2. **Given** les GET automatiques
   **Then** ils ne sont pas loggés

---

## Tasks / Subtasks

- [x] **Task 1: Logger les tests manuels** (AC: #1)
  - [x] Dans HealthController::testAll()
  - [x] Utiliser activity('superadmin')

- [x] **Task 2: Exclure les GET du logging** (AC: #2)
  - [x] Ne pas logger dans index()

---

## Dev Notes

### Logging dans testAll

```php
<?php

namespace Modules\Superadmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Superadmin\Services\ServiceHealthChecker;

class HealthController extends Controller
{
    /**
     * POST /api/superadmin/health/test-all
     * Test complet avec audit trail
     */
    public function testAll(): JsonResponse
    {
        $startTime = microtime(true);

        $results = $this->healthChecker->testAll(fullTest: true);

        // Logger le test manuel dans l'audit trail
        activity('superadmin')
            ->causedBy(auth()->id())
            ->withProperties([
                'action' => 'health.test_all',
                'overall_status' => $results->getOverallStatus(),
                'services_tested' => count($results->getResults()),
                'failed_services' => $this->getFailedServices($results),
                'degraded_services' => $this->getDegradedServices($results),
                'total_time_ms' => round((microtime(true) - $startTime) * 1000, 2),
            ])
            ->log('Health check performed');

        // ... reste du code
    }

    protected function getFailedServices($results): array
    {
        $failed = [];
        foreach ($results->getResults() as $result) {
            if (!$result->healthy) {
                $failed[] = [
                    'service' => $result->service,
                    'message' => $result->message,
                ];
            }
        }
        return $failed;
    }

    protected function getDegradedServices($results): array
    {
        $degraded = [];
        foreach ($results->getResults() as $result) {
            if ($result->healthy && $result->isDegraded()) {
                $degraded[] = [
                    'service' => $result->service,
                    'latencyMs' => $result->latencyMs,
                ];
            }
        }
        return $degraded;
    }
}
```

### Listener pour Events (Alternative)

```php
<?php

namespace Modules\Superadmin\Listeners;

use Modules\Superadmin\Events\HealthCheckPerformed;

class LogHealthCheck
{
    public function handle(HealthCheckPerformed $event): void
    {
        // Seulement pour les tests manuels
        if (!$event->isManualTest) {
            return;
        }

        activity('superadmin')
            ->causedBy($event->performedBy)
            ->withProperties([
                'action' => 'health.test_all',
                'overall_status' => $event->results->getOverallStatus(),
                'services_tested' => count($event->results->getResults()),
                'failed_services' => $event->getFailedServices(),
                'degraded_services' => $event->getDegradedServices(),
                'total_time_ms' => $event->totalTimeMs,
            ])
            ->log('Health check performed');
    }
}
```

### Event HealthCheckPerformed (Optionnel)

```php
<?php

namespace Modules\Superadmin\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Modules\Superadmin\Services\Checkers\HealthCheckResultCollection;

class HealthCheckPerformed
{
    use Dispatchable;

    public function __construct(
        public readonly HealthCheckResultCollection $results,
        public readonly int $performedBy,
        public readonly float $totalTimeMs,
        public readonly bool $isManualTest = true
    ) {}

    public function getFailedServices(): array
    {
        $failed = [];
        foreach ($this->results->getResults() as $result) {
            if (!$result->healthy) {
                $failed[] = $result->service;
            }
        }
        return $failed;
    }

    public function getDegradedServices(): array
    {
        $degraded = [];
        foreach ($this->results->getResults() as $result) {
            if ($result->healthy && $result->isDegraded()) {
                $degraded[] = $result->service;
            }
        }
        return $degraded;
    }
}
```

### Exemple d'Enregistrement Audit

```json
{
  "log_name": "superadmin",
  "description": "Health check performed",
  "subject_type": null,
  "subject_id": null,
  "causer_type": "App\\Models\\User",
  "causer_id": 1,
  "properties": {
    "action": "health.test_all",
    "overall_status": "degraded",
    "services_tested": 6,
    "failed_services": [
      {
        "service": "meilisearch",
        "message": "Connection refused"
      }
    ],
    "degraded_services": [
      {
        "service": "ses",
        "latencyMs": 890
      }
    ],
    "total_time_ms": 1245.67
  }
}
```

### Actions d'Audit Health

| Action | Description |
|--------|-------------|
| `health.test_all` | Test de connectivité global manuel |

### Ce qui N'EST PAS loggé

- `GET /api/superadmin/health` - Lecture simple du dashboard
- `POST /api/superadmin/health/refresh` - Rafraîchissement du cache
- Checks automatiques via spatie/laravel-health scheduler

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR72]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.7]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Ajouté logging dans testAll() avec activity('superadmin')
- ✅ Logs incluent: action, overall_status, services_tested, failed_services, degraded_services, total_time_ms
- ✅ Créé méthode getFailedServices() pour extraire les services en échec avec détails
- ✅ Créé méthode getDegradedServices() pour extraire les services dégradés avec latence
- ✅ Les GET automatiques (index()) ne sont PAS loggés comme requis
- ✅ Les refresh() ne sont PAS loggés comme requis
- ✅ Causé par auth()->id() pour tracer qui a lancé le test

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/HealthController.php

## Change Log
- 2026-01-28: Ajout de l'audit trail pour les health checks manuels avec spatie/laravel-activitylog

## Status
**review**
