# Story 4.5: API Analyse Impact Désactivation

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **un endpoint API pour analyser l'impact d'une désactivation**,
so that **je peux voir les conséquences avant de confirmer**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle `GET /api/superadmin/sites/{id}/modules/{module}/impact`
   **Then** je reçois l'analyse d'impact complète

2. **Given** un module avec des dépendants
   **When** j'appelle l'endpoint
   **Then** je vois la liste des modules bloquants

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter la méthode au ModuleController** (AC: #1)
  - [x] Implémenter `deactivationImpact()`
  - [x] Utiliser `ImpactAnalyzer`

- [x] **Task 2: Créer la Resource** (AC: #1, #2)
  - [x] Formater l'impact pour l'API

- [x] **Task 3: Configurer la route** (AC: #1)
  - [x] Route GET

---

## Dev Notes

### Endpoint

```
GET /api/superadmin/sites/{id}/modules/{module}/impact
```

### ModuleController

```php
/**
 * Analyse l'impact de la désactivation d'un module
 * GET /api/superadmin/sites/{id}/modules/{module}/impact
 */
public function deactivationImpact(int $id, string $module): JsonResponse
{
    $tenant = Tenant::findOrFail($id);

    try {
        $impact = $this->impactAnalyzer->analyzeDeactivationImpact($tenant, $module);

        return response()->json([
            'data' => $impact->toArray(),
        ]);
    } catch (\InvalidArgumentException $e) {
        return response()->json([
            'message' => $e->getMessage(),
        ], 404);
    }
}
```

### Route

```php
Route::get('sites/{id}/modules/{module}/impact', [ModuleController::class, 'deactivationImpact'])
    ->middleware('throttle:superadmin-read')
    ->name('superadmin.sites.modules.impact');
```

### Format de Réponse

```json
{
    "data": {
        "moduleName": "CustomersContracts",
        "tenantId": 1,
        "fileCount": 47,
        "totalSizeBytes": 15728640,
        "totalSizeHuman": "15 MB",
        "canDeactivate": false,
        "blockingModules": [],
        "hasConfig": true,
        "warnings": [
            "Large amount of data will be deleted (15 MB)"
        ]
    }
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR18]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.5]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Ajouté la méthode `deactivationImpact()` au ModuleController
- ✅ Injection de ImpactAnalyzer dans le contrôleur
- ✅ Format de réponse JSON avec impact.toArray()
- ✅ Gestion des erreurs 404 pour module inactif
- ✅ Route GET ajoutée avec throttle:superadmin-read

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ModuleController.php
- Modules/Superadmin/Routes/superadmin.php

## Change Log
- 2026-01-28: Création de l'endpoint API pour l'analyse d'impact

