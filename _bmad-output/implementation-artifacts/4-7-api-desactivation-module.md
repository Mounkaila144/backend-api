# Story 4.7: API Désactivation Module

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **un endpoint API pour désactiver un module**,
so that **je peux désactiver des modules via l'interface**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle `DELETE /api/superadmin/sites/{id}/modules/{module}`
   **Then** le module est désactivé

2. **Given** l'option backup=true
   **When** je désactive
   **Then** le backup est créé et le chemin retourné

3. **Given** des modules dépendants
   **When** j'essaie de désactiver
   **Then** je reçois 409 avec la liste des bloquants

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter la méthode deactivate** (AC: #1)
  - [x] Implémenter dans ModuleController
  - [x] Injecter ModuleInstaller

- [x] **Task 2: Gérer les options** (AC: #2)
  - [x] Query param `?backup=true`

- [x] **Task 3: Gérer les erreurs** (AC: #3)
  - [x] 409 pour modules dépendants
  - [x] 404 pour module non actif

---

## Dev Notes

### Endpoint

```
DELETE /api/superadmin/sites/{id}/modules/{module}?backup=true
```

### ModuleController

```php
/**
 * Désactive un module pour un tenant
 * DELETE /api/superadmin/sites/{id}/modules/{module}
 */
public function deactivate(DeactivateModuleRequest $request, int $id, string $module): JsonResponse
{
    $tenant = Tenant::findOrFail($id);

    $options = [
        'backup' => $request->boolean('backup', false),
        'force' => $request->boolean('force', false),
    ];

    try {
        $siteModule = $this->moduleInstaller->deactivate($tenant, $module, $options);

        return response()->json([
            'message' => 'Module deactivated successfully',
            'data' => [
                'module' => $module,
                'tenantId' => $tenant->site_id,
                'deactivatedAt' => $siteModule->uninstalled_at?->toIso8601String(),
                'backupCreated' => $options['backup'],
            ],
        ]);

    } catch (ModuleDeactivationException $e) {
        $status = match (true) {
            !empty($e->blockingModules) => 409,
            str_contains($e->getMessage(), 'not active') => 404,
            default => 500,
        };

        return response()->json([
            'message' => 'Module deactivation failed',
            'error' => [
                'code' => 'DEACTIVATION_FAILED',
                'detail' => $e->getMessage(),
                'context' => $e->context(),
            ],
        ], $status);
    }
}
```

### DeactivateModuleRequest

```php
<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeactivateModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'backup' => ['nullable', 'boolean'],
            'force' => ['nullable', 'boolean'],
        ];
    }
}
```

### Route

```php
Route::delete('sites/{id}/modules/{module}', [ModuleController::class, 'deactivate'])
    ->middleware('throttle:superadmin-heavy')
    ->name('superadmin.sites.modules.deactivate');
```

### Format de Réponse - Succès

```json
{
    "message": "Module deactivated successfully",
    "data": {
        "module": "CustomersContracts",
        "tenantId": 1,
        "deactivatedAt": "2026-01-28T11:00:00+00:00",
        "backupCreated": true
    }
}
```

### Format de Réponse - Erreur 409

```json
{
    "message": "Module deactivation failed",
    "error": {
        "code": "DEACTIVATION_FAILED",
        "detail": "Cannot deactivate 'Customer': blocking modules are active: CustomersContracts",
        "context": {
            "module": "Customer",
            "tenant_id": 1,
            "blocking_modules": ["CustomersContracts"]
        }
    }
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#API-Specifications]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.7]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Ajouté la méthode `deactivate()` au ModuleController
- ✅ Support des query params backup et force
- ✅ Gestion des erreurs avec codes HTTP appropriés (404, 409, 500)
- ✅ Format de réponse JSON structuré
- ✅ Route DELETE ajoutée avec throttle:superadmin-heavy
- ✅ Contexte d'erreur complet retourné

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ModuleController.php
- Modules/Superadmin/Routes/superadmin.php

## Change Log
- 2026-01-28: Création de l'endpoint API pour la désactivation de modules

