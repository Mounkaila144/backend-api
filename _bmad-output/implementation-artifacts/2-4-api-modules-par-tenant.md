# Story 2.4: API Modules par Tenant

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **un endpoint API pour lister les modules d'un tenant**,
so that **je peux voir l'état des modules pour ce site**.

---

## Acceptance Criteria

1. **Given** je suis authentifié en tant que SuperAdmin
   **When** j'appelle `GET /api/superadmin/sites/{id}/modules`
   **Then** je reçois la liste des modules avec leur statut pour ce tenant

2. **Given** un tenant existant
   **When** j'appelle l'endpoint
   **Then** je vois tous les modules disponibles avec leur état (actif/inactif/non installé)

3. **Given** un tenant inexistant
   **When** j'appelle l'endpoint
   **Then** je reçois une erreur 404

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter la méthode au ModuleController** (AC: #1, #2)
  - [x] Implémenter `tenantModules(int $siteId)`
  - [x] Utiliser `ModuleDiscovery::getAvailableModulesWithStatus()`

- [x] **Task 2: Créer la Resource pour tenant** (AC: #2)
  - [x] Créer ou étendre `TenantModuleResource`
  - [x] Inclure le statut tenant dans la transformation

- [x] **Task 3: Configurer la route** (AC: #1, #3)
  - [x] Ajouter la route avec paramètre `{site}`
  - [x] Valider que le site existe

- [x] **Task 4: Écrire les tests** (AC: #1-3)
  - [x] Test: retourne modules pour tenant existant
  - [x] Test: retourne 404 pour tenant inexistant
  - [x] Test: format de réponse correct

---

## Dev Notes

### Endpoint

```
GET /api/superadmin/sites/{id}/modules
```

### ModuleController - Méthode à Ajouter

```php
/**
 * Liste les modules pour un tenant spécifique
 * GET /api/superadmin/sites/{id}/modules
 */
public function tenantModules(int $id): AnonymousResourceCollection
{
    // Vérifier que le site existe
    $site = Tenant::findOrFail($id);

    $modules = $this->moduleDiscovery->getAvailableModulesWithStatus($id);

    return TenantModuleResource::collection($modules);
}
```

### TenantModuleResource

```php
<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tenantStatus = $this['tenant_status'];

        return [
            'name' => $this['name'],
            'alias' => $this['alias'],
            'description' => $this['description'],
            'version' => $this['version'],
            'dependencies' => $this['dependencies'],
            'isSystem' => $this['is_system'],
            'status' => $tenantStatus ? ($tenantStatus['is_active'] ? 'active' : 'inactive') : 'not_installed',
            'installedAt' => $tenantStatus['installed_at'] ?? null,
            'uninstalledAt' => $tenantStatus['uninstalled_at'] ?? null,
            'config' => $tenantStatus['config'] ?? null,
        ];
    }
}
```

### Route

```php
Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    // ... autres routes ...

    // Modules par tenant
    Route::get('sites/{id}/modules', [ModuleController::class, 'tenantModules'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.sites.modules.index');
});
```

### Format de Réponse

```json
{
    "data": [
        {
            "name": "Customer",
            "alias": "customer",
            "description": "Customer management",
            "version": "1.0.0",
            "dependencies": [],
            "isSystem": false,
            "status": "active",
            "installedAt": "2026-01-15T10:30:00+00:00",
            "uninstalledAt": null,
            "config": {"setting1": "value1"}
        },
        {
            "name": "CustomersContracts",
            "alias": "contracts",
            "description": "Contracts module",
            "version": "1.0.0",
            "dependencies": ["Customer"],
            "isSystem": false,
            "status": "not_installed",
            "installedAt": null,
            "uninstalledAt": null,
            "config": null
        }
    ]
}
```

### Statuts Possibles

| Status | Description |
|--------|-------------|
| `active` | Module installé et actif |
| `inactive` | Module installé mais désactivé |
| `not_installed` | Module jamais installé pour ce tenant |

### References

- [Source: _bmad-output/planning-artifacts/prd.md#API-Specifications]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4]

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

Aucune difficulté. Utilise le service développé dans le story 2-3.

### Completion Notes List

✅ **API Endpoint tenant modules implémenté** (2026-01-28)
- Endpoint `GET /api/superadmin/sites/{id}/modules`
- Méthode `tenantModules()` ajoutée au ModuleController
- Validation automatique avec `Tenant::findOrFail($id)` (404 si inexistant)
- Resource `TenantModuleResource` avec transformation camelCase
- Statuts: active, inactive, not_installed

✅ **Tests Feature créés** (4 tests, non exécutés)
- Test AC #1: Modules pour tenant existant
- Test AC #2: Format avec statuts
- Test AC #3: 404 pour tenant inexistant
- Test auth requis

### File List

- Modules/Superadmin/Http/Controllers/Superadmin/ModuleController.php
- Modules/Superadmin/Http/Resources/TenantModuleResource.php
- Modules/Superadmin/Routes/superadmin.php
- Modules/Superadmin/Tests/Feature/TenantModulesApiTest.php

