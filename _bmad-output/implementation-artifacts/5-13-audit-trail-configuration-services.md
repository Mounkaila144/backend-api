# Story 5.13: Audit Trail Configuration Services

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **que les modifications de config soient tracées**,
so that **j'ai un historique des changements**.

---

## Acceptance Criteria

1. **Given** une modification de config service
   **When** je consulte l'audit
   **Then** je vois: service, user, timestamp, champs modifiés

2. **Given** un test de connexion
   **When** je consulte l'audit
   **Then** je vois le résultat du test

---

## Tasks / Subtasks

- [x] **Task 1: Vérifier l'event ServiceConfigUpdated** (AC: #1)
  - [x] S'assurer qu'il est dispatché
  - [x] Ajouter un listener pour l'audit

- [x] **Task 2: Logger les tests de connexion** (AC: #2)
  - [x] Logger les résultats des health checks

---

## Dev Notes

### Listener pour ServiceConfigUpdated

```php
<?php

namespace Modules\Superadmin\Listeners;

use Modules\Superadmin\Events\ServiceConfigUpdated;

class LogServiceConfigUpdate
{
    public function handle(ServiceConfigUpdated $event): void
    {
        activity('superadmin')
            ->performedOn($event->serviceConfig)
            ->causedBy($event->updatedBy)
            ->withProperties([
                'action' => 'service.config.updated',
                'service' => $event->serviceConfig->service_name,
                'changed_fields' => $event->changedFields,
            ])
            ->log("Service {$event->serviceConfig->service_name} configuration updated");
    }
}
```

### Logger les Tests de Connexion

```php
// Dans ServiceConfigController après chaque test
activity('superadmin')
    ->causedBy(auth()->id())
    ->withProperties([
        'action' => 'service.connection.tested',
        'service' => $serviceName,
        'result' => $result->healthy ? 'success' : 'failed',
        'message' => $result->message,
    ])
    ->log("Service {$serviceName} connection test: " . ($result->healthy ? 'success' : 'failed'));
```

### Actions d'Audit Config

| Action | Description |
|--------|-------------|
| `service.config.updated` | Configuration modifiée |
| `service.connection.tested` | Test de connexion effectué |

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR34]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.13]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé LogServiceConfigUpdate listener pour tracer les modifications de config
- Event ServiceConfigUpdated est déjà dispatché dans ServiceConfigManager::save()
- Ajouté audit trail logging dans tous les endpoints de test de connexion
- Enregistré le listener dans SuperadminServiceProvider
- Logs incluent: service, user, timestamp, résultat, message

### File List
- Modules/Superadmin/Listeners/LogServiceConfigUpdate.php (new)
- Modules/Superadmin/Providers/SuperadminServiceProvider.php (modified)
- Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php (modified)

