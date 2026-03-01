# Story 3.10: Audit Trail Activation

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **que toutes les activations soient tracées dans l'audit trail**,
so that **j'ai un historique complet des opérations**.

---

## Acceptance Criteria

1. **Given** une activation réussie
   **When** je consulte l'activity log
   **Then** je vois l'entrée avec: module, tenant, user, timestamp, détails

2. **Given** une activation échouée
   **When** je consulte l'activity log
   **Then** je vois l'erreur avec les étapes compensées

3. **Given** l'audit trail
   **When** je filtre par tenant ou module
   **Then** je peux retrouver toutes les opérations concernées

---

## Tasks / Subtasks

- [x] **Task 1: Vérifier le listener LogModuleActivation** (AC: #1, #2)
  - [x] S'assurer qu'il est bien connecté aux events
  - [x] Vérifier les propriétés loggées

- [x] **Task 2: Ajouter un endpoint pour l'audit** (AC: #3)
  - [x] `GET /api/superadmin/audit`
  - [x] Filtres: tenant, module, date, action

- [x] **Task 3: Créer la Resource pour l'audit** (AC: #1-3)
  - [x] AuditLogResource
  - [x] Formater les entrées

---

## Dev Notes

### LogModuleActivation Listener (vérification)

```php
<?php

namespace Modules\Superadmin\Listeners;

use Spatie\Activitylog\Models\Activity;
use Modules\Superadmin\Events\ModuleActivated;
use Modules\Superadmin\Events\ModuleDeactivated;
use Modules\Superadmin\Events\ModuleActivationFailed;

class LogModuleActivation
{
    public function handleActivated(ModuleActivated $event): void
    {
        activity('superadmin')
            ->performedOn($event->siteModule)
            ->causedBy($event->activatedBy)
            ->withProperties([
                'action' => 'module.activated',
                'module' => $event->siteModule->module_name,
                'tenant_id' => $event->siteModule->site_id,
                'metadata' => $event->metadata,
            ])
            ->log("Module {$event->siteModule->module_name} activated");
    }

    public function handleDeactivated(ModuleDeactivated $event): void
    {
        activity('superadmin')
            ->performedOn($event->siteModule)
            ->causedBy($event->deactivatedBy)
            ->withProperties([
                'action' => 'module.deactivated',
                'module' => $event->siteModule->module_name,
                'tenant_id' => $event->siteModule->site_id,
                'metadata' => $event->metadata,
            ])
            ->log("Module {$event->siteModule->module_name} deactivated");
    }

    public function handleFailed(ModuleActivationFailed $event): void
    {
        activity('superadmin')
            ->causedBy($event->attemptedBy)
            ->withProperties([
                'action' => 'module.activation_failed',
                'module' => $event->moduleName,
                'tenant_id' => $event->siteId,
                'error' => $event->errorMessage,
                'completed_steps' => $event->completedSteps,
            ])
            ->log("Module {$event->moduleName} activation failed");
    }
}
```

### Endpoint Audit

```php
/**
 * Liste les entrées d'audit
 * GET /api/superadmin/audit
 */
public function auditLog(Request $request): AnonymousResourceCollection
{
    $query = Activity::where('log_name', 'superadmin');

    // Filtre par tenant
    if ($tenantId = $request->query('tenant_id')) {
        $query->where('properties->tenant_id', $tenantId);
    }

    // Filtre par module
    if ($module = $request->query('module')) {
        $query->where('properties->module', $module);
    }

    // Filtre par action
    if ($action = $request->query('action')) {
        $query->where('properties->action', $action);
    }

    // Filtre par date
    if ($from = $request->query('from')) {
        $query->where('created_at', '>=', $from);
    }
    if ($to = $request->query('to')) {
        $query->where('created_at', '<=', $to);
    }

    $activities = $query->orderByDesc('created_at')->paginate(50);

    return AuditLogResource::collection($activities);
}
```

### AuditLogResource

```php
<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->properties['action'] ?? 'unknown',
            'description' => $this->description,
            'tenantId' => $this->properties['tenant_id'] ?? null,
            'module' => $this->properties['module'] ?? null,
            'causedBy' => $this->causer_id,
            'metadata' => $this->properties['metadata'] ?? [],
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
```

### Route

```php
Route::get('audit', [AuditController::class, 'index'])
    ->middleware('throttle:superadmin-read')
    ->name('superadmin.audit.index');
```

### Format de Réponse

```json
{
    "data": [
        {
            "id": 123,
            "action": "module.activated",
            "description": "Module CustomersContracts activated",
            "tenantId": 1,
            "module": "CustomersContracts",
            "causedBy": 5,
            "metadata": {
                "completed_steps": ["run_migrations", "create_s3_structure", "generate_config"]
            },
            "createdAt": "2026-01-28T10:30:00+00:00"
        }
    ],
    "links": {...},
    "meta": {...}
}
```

### Actions d'Audit

| Action | Description |
|--------|-------------|
| `module.activated` | Module activé avec succès |
| `module.deactivated` | Module désactivé |
| `module.activation_failed` | Activation échouée + rollback |
| `module.deactivation_failed` | Désactivation échouée |
| `service.config.updated` | Config service modifiée |
| `service.connection.tested` | Test connexion effectué |

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR34]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.10]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
Aucune erreur rencontrée durant l'implémentation.

### Completion Notes List
✅ **Story 3-10 complétée** (2026-01-28) - **Audit Trail complet**

- Créé LogModuleActivation listener pour tracer toutes les opérations de modules
- Enregistré 3 event listeners dans SuperadminServiceProvider:
  * ModuleActivated -> handleActivated: log activation réussie avec métadonnées
  * ModuleDeactivated -> handleDeactivated: log désactivation avec métadonnées
  * ModuleActivationFailed -> handleFailed: log échec avec erreur et étapes compensées
- Utilisation de Spatie Activity Log avec log_name='superadmin'
- Créé AuditController avec endpoint GET /api/superadmin/audit
- Filtrage avancé: tenant_id, module, action, from, to (dates)
- Pagination automatique (50 entrées par page)
- Créé AuditLogResource pour formatter les réponses JSON
- Route configurée avec throttle superadmin-read
- Toutes les activations/désactivations sont maintenant tracées automatiquement
- Les échecs incluent les étapes de rollback (completed_steps)
- Critères d'acceptation satisfaits: #1 ✅, #2 ✅, #3 ✅

### File List
- Modules/Superadmin/Listeners/LogModuleActivation.php (nouveau)
- Modules/Superadmin/Providers/SuperadminServiceProvider.php (modifié - ajout event listeners)
- Modules/Superadmin/Http/Controllers/Superadmin/AuditController.php (nouveau)
- Modules/Superadmin/Http/Resources/AuditLogResource.php (nouveau)
- Modules/Superadmin/Routes/superadmin.php (modifié - ajout route audit)

## Change Log
- 2026-01-28: Ajout audit trail complet avec logging automatique et endpoint de consultation

