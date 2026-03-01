# Story 5.4: Health Checker Database

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **tester la connexion à la base de données centrale**,
so that **je sais si la BDD est accessible**.

---

## Acceptance Criteria

1. **Given** une config DB valide
   **When** j'appelle `check()`
   **Then** je reçois un résultat positif avec version et stats

2. **Given** une config DB invalide
   **When** j'appelle `check()`
   **Then** je reçois un résultat négatif avec l'erreur

---

## Tasks / Subtasks

- [x] **Task 1: Créer DatabaseHealthChecker** (AC: #1, #2)
  - [x] Tester la connexion
  - [x] Récupérer la version et les stats

---

## Dev Notes

### DatabaseHealthChecker

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\DB;

class DatabaseHealthChecker implements HealthCheckerInterface
{
    protected string $serviceName = 'database';

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            // Test connexion avec query simple
            $version = DB::selectOne('SELECT VERSION() as version');
            $dbName = DB::selectOne('SELECT DATABASE() as db_name');

            // Stats basiques
            $tableCount = DB::selectOne("
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
            ");

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Database connection successful',
                details: [
                    'version' => $version->version ?? 'Unknown',
                    'database' => $dbName->db_name ?? 'Unknown',
                    'table_count' => $tableCount->count ?? 0,
                ],
                latencyMs: $latency
            );

        } catch (\Exception $e) {
            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Database connection failed: ' . $e->getMessage(),
                details: [],
                latencyMs: $latency
            );
        }
    }
}
```

### Note

Pour la base de données centrale, on utilise la connexion par défaut de Laravel. La config est dans `.env`, pas dans `t_service_config`.

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR47, FR49]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.4]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé DatabaseHealthChecker pour vérifier la connexion à la base centrale
- Récupère la version MySQL/MariaDB et le nombre de tables
- Mesure la latence de connexion
- Utilise la connexion Laravel par défaut (pas de config dans t_service_config)

### File List
- Modules/Superadmin/Services/Checkers/DatabaseHealthChecker.php (new)

