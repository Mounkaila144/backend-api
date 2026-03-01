# Story 6.4: Indicateurs Visuels de Statut

**Status:** ready-for-dev

---

## Story

As a **SuperAdmin**,
I want **que les statuts de services aient des indicateurs clairs**,
so that **je comprends rapidement l'état de chaque service**.

---

## Acceptance Criteria

1. **Given** le dashboard santé
   **When** je consulte l'état des services
   **Then** chaque service a un statut parmi:
   - `healthy` (vert): Service opérationnel, latence normale
   - `degraded` (jaune): Service opérationnel mais latence élevée
   - `unhealthy` (rouge): Service non opérationnel ou erreur
   - `unknown` (gris): Service non configuré ou non testé

2. **Given** les seuils de latence
   **Then** ils sont configurables par service

---

## Tasks / Subtasks

- [x] **Task 1: Définir les seuils de latence** (AC: #1, #2)
  - [x] Créer config/health-thresholds.php
  - [x] Seuils par défaut par service

- [x] **Task 2: Implémenter le calcul de statut** (AC: #1)
  - [x] Méthode `isDegraded()` dans HealthCheckResult
  - [x] Utiliser les seuils configurés

---

## Dev Notes

### Configuration des Seuils

```php
<?php

// config/health-thresholds.php
return [
    'latency' => [
        's3' => [
            'healthy' => 500,    // < 500ms
            'degraded' => 2000,  // < 2000ms
        ],
        'database' => [
            'healthy' => 100,    // < 100ms
            'degraded' => 500,   // < 500ms
        ],
        'redis-cache' => [
            'healthy' => 50,     // < 50ms
            'degraded' => 200,   // < 200ms
        ],
        'redis-queue' => [
            'healthy' => 50,     // < 50ms
            'degraded' => 200,   // < 200ms
        ],
        'ses' => [
            'healthy' => 500,    // < 500ms
            'degraded' => 2000,  // < 2000ms
        ],
        'meilisearch' => [
            'healthy' => 200,    // < 200ms
            'degraded' => 1000,  // < 1000ms
        ],
    ],
];
```

### HealthCheckResult avec isDegraded

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

class HealthCheckResult
{
    public function __construct(
        public readonly string $service,
        public readonly bool $healthy,
        public readonly string $message,
        public readonly array $details,
        public readonly ?float $latencyMs = null
    ) {}

    public function isDegraded(): bool
    {
        if (!$this->healthy) {
            return false; // Unhealthy, not degraded
        }

        if ($this->latencyMs === null) {
            return false;
        }

        $thresholds = config("health-thresholds.latency.{$this->service}");

        if (!$thresholds) {
            return false;
        }

        // Si latence > seuil healthy mais < seuil degraded
        return $this->latencyMs > $thresholds['healthy']
            && $this->latencyMs <= $thresholds['degraded'];
    }

    public function isHighLatency(): bool
    {
        if ($this->latencyMs === null) {
            return false;
        }

        $thresholds = config("health-thresholds.latency.{$this->service}");

        if (!$thresholds) {
            return false;
        }

        return $this->latencyMs > $thresholds['degraded'];
    }

    public function getStatus(): string
    {
        if (!$this->healthy) {
            return 'unhealthy';
        }

        if ($this->isDegraded() || $this->isHighLatency()) {
            return 'degraded';
        }

        return 'healthy';
    }

    public function toArray(): array
    {
        return [
            'service' => $this->service,
            'status' => $this->getStatus(),
            'healthy' => $this->healthy,
            'message' => $this->message,
            'details' => $this->details,
            'latencyMs' => $this->latencyMs ? round($this->latencyMs, 2) : null,
        ];
    }
}
```

### Statuts et Couleurs (Frontend Reference)

| Statut | Couleur | Description |
|--------|---------|-------------|
| `healthy` | Vert (#22c55e) | Service opérationnel, latence normale |
| `degraded` | Jaune (#eab308) | Service opérationnel mais latence élevée |
| `unhealthy` | Rouge (#ef4444) | Service non opérationnel ou erreur |
| `unknown` | Gris (#6b7280) | Service non configuré ou non testé |

### Seuils par Défaut

| Service | Healthy | Degraded (Warning) |
|---------|---------|-------------------|
| S3/Minio | < 500ms | < 2000ms |
| Database | < 100ms | < 500ms |
| Redis Cache | < 50ms | < 200ms |
| Redis Queue | < 50ms | < 200ms |
| Amazon SES | < 500ms | < 2000ms |
| Meilisearch | < 200ms | < 1000ms |

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR70]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.4]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Créé fichier de configuration config/health-thresholds.php avec seuils par service
- ✅ Implémenté méthode isDegraded() pour détecter les services avec latence élevée
- ✅ Implémenté méthode isHighLatency() pour détecter les latences excessives
- ✅ Implémenté méthode getStatus() qui retourne 'healthy', 'degraded', ou 'unhealthy'
- ✅ Modifié toArray() pour inclure le statut calculé au lieu de 'connected'/'disconnected'
- ✅ Seuils configurables: S3 (500ms/2s), Database (100ms/500ms), Redis (50ms/200ms), SES (500ms/2s), Meilisearch (200ms/1s)

### File List
- config/health-thresholds.php
- Modules/Superadmin/Services/Checkers/HealthCheckResult.php

## Change Log
- 2026-01-28: Ajout des indicateurs visuels de statut avec seuils de latence configurables

## Status
**review**
