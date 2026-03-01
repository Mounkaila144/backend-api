# Story 2.5: Filtrage et Recherche Modules

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **filtrer et rechercher des modules**,
so that **je trouve rapidement les modules que je cherche**.

---

## Acceptance Criteria

1. **Given** l'endpoint des modules
   **When** j'ajoute le paramètre `?search=contract`
   **Then** seuls les modules contenant "contract" sont retournés

2. **Given** l'endpoint des modules
   **When** j'ajoute le paramètre `?category=crm`
   **Then** seuls les modules de cette catégorie sont retournés

3. **Given** l'endpoint des modules par tenant
   **When** j'ajoute le paramètre `?status=active`
   **Then** seuls les modules actifs pour ce tenant sont retournés

---

## Tasks / Subtasks

- [ ] **Task 1: Ajouter le filtrage par recherche** (AC: #1)
  - [ ] Créer un FilterRequest pour la validation
  - [ ] Implémenter la recherche par nom/description
  - [ ] Appliquer au ModuleController

- [ ] **Task 2: Ajouter le filtrage par catégorie** (AC: #2)
  - [ ] Définir les catégories possibles
  - [ ] Implémenter le filtre dans ModuleDiscovery
  - [ ] Documenter les catégories

- [ ] **Task 3: Ajouter le filtrage par statut** (AC: #3)
  - [ ] Filtre status: active, inactive, not_installed
  - [ ] Appliquer uniquement à l'endpoint tenant

- [ ] **Task 4: Écrire les tests** (AC: #1-3)
  - [ ] Test recherche textuelle
  - [ ] Test filtre catégorie
  - [ ] Test filtre statut

---

## Dev Notes

### Paramètres de Requête

| Paramètre | Type | Description | Valeurs |
|-----------|------|-------------|---------|
| `search` | string | Recherche textuelle | Nom ou description |
| `category` | string | Filtre catégorie | crm, accounting, hr, etc. |
| `status` | string | Filtre statut (tenant) | active, inactive, not_installed |

### FilterModulesRequest

```php
<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FilterModulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth gérée par middleware
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'in:crm,accounting,hr,communication,analytics'],
            'status' => ['nullable', 'string', 'in:active,inactive,not_installed'],
        ];
    }
}
```

### ModuleDiscovery - Méthodes de Filtrage

```php
/**
 * Filtre les modules par recherche textuelle
 */
public function filterBySearch(Collection $modules, ?string $search): Collection
{
    if (empty($search)) {
        return $modules;
    }

    $search = strtolower($search);

    return $modules->filter(function ($module) use ($search) {
        return str_contains(strtolower($module['name']), $search)
            || str_contains(strtolower($module['description'] ?? ''), $search)
            || str_contains(strtolower($module['alias'] ?? ''), $search);
    });
}

/**
 * Filtre les modules par catégorie
 */
public function filterByCategory(Collection $modules, ?string $category): Collection
{
    if (empty($category)) {
        return $modules;
    }

    return $modules->filter(fn ($module) => ($module['category'] ?? '') === $category);
}

/**
 * Filtre les modules par statut tenant
 */
public function filterByStatus(Collection $modules, ?string $status): Collection
{
    if (empty($status)) {
        return $modules;
    }

    return $modules->filter(function ($module) use ($status) {
        $tenantStatus = $module['tenant_status'] ?? null;

        return match ($status) {
            'active' => $tenantStatus && $tenantStatus['is_active'],
            'inactive' => $tenantStatus && !$tenantStatus['is_active'],
            'not_installed' => $tenantStatus === null,
            default => true,
        };
    });
}
```

### ModuleController - Mise à Jour

```php
public function index(FilterModulesRequest $request): AnonymousResourceCollection
{
    $modules = $this->moduleDiscovery->getAvailableModules();

    $modules = $this->moduleDiscovery->filterBySearch($modules, $request->search);
    $modules = $this->moduleDiscovery->filterByCategory($modules, $request->category);

    return ModuleResource::collection($modules);
}

public function tenantModules(int $id, FilterModulesRequest $request): AnonymousResourceCollection
{
    $site = Tenant::findOrFail($id);

    $modules = $this->moduleDiscovery->getAvailableModulesWithStatus($id);

    $modules = $this->moduleDiscovery->filterBySearch($modules, $request->search);
    $modules = $this->moduleDiscovery->filterByCategory($modules, $request->category);
    $modules = $this->moduleDiscovery->filterByStatus($modules, $request->status);

    return TenantModuleResource::collection($modules);
}
```

### Exemples d'Appels API

```
GET /api/superadmin/modules?search=customer
GET /api/superadmin/modules?category=crm
GET /api/superadmin/sites/1/modules?status=active
GET /api/superadmin/sites/1/modules?search=contract&status=not_installed
```

### Catégories Suggérées

À définir dans `module.json` de chaque module:

```json
{
    "name": "Customer",
    "category": "crm",
    ...
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR5, FR6]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5]

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

