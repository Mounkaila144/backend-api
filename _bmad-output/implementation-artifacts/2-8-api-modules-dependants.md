# Story 2.8: API Modules Dépendants

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **voir les modules qui dépendent d'un module donné**,
so that **je sais l'impact avant de désactiver un module**.

---

## Acceptance Criteria

1. **Given** je suis authentifié en tant que SuperAdmin
   **When** j'appelle `GET /api/superadmin/modules/{module}/dependents`
   **Then** je reçois la liste des modules qui dépendent de ce module

2. **Given** la liste des dépendants
   **When** je consulte pour un tenant spécifique
   **Then** je vois quels dépendants sont actifs pour ce tenant

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter la méthode** (AC: #1)
  - [x] Implémenter `dependents(string $module)`
  - [x] Utiliser `ModuleDependencyResolver::getDependents()`

- [x] **Task 2: Enrichir avec statut tenant** (AC: #2)
  - [x] Optionnel: query param `?site_id=X`
  - [x] Indiquer si le dépendant est actif pour ce tenant

- [x] **Task 3: Configurer la route** (AC: #1)
  - [x] Ajouter la route avec paramètre

---

## Dev Notes

### Endpoint

```
GET /api/superadmin/modules/{module}/dependents
GET /api/superadmin/modules/{module}/dependents?site_id=1
```

### ModuleController - Méthode

```php
/**
 * Retourne les modules dépendant d'un module donné
 * GET /api/superadmin/modules/{module}/dependents
 */
public function dependents(Request $request, string $module): JsonResponse
{
    $dependents = $this->dependencyResolver->getDependents($module);
    $siteId = $request->query('site_id');

    $result = collect($dependents)->map(function ($dep) use ($siteId) {
        $data = ['name' => $dep];

        if ($siteId) {
            $data['isActiveForTenant'] = $this->moduleDiscovery->isModuleActiveForTenant((int) $siteId, $dep);
        }

        return $data;
    });

    return response()->json([
        'data' => [
            'module' => $module,
            'dependents' => $result,
            'count' => $result->count(),
        ]
    ]);
}
```

### Format de Réponse (sans site_id)

```json
{
    "data": {
        "module": "Customer",
        "dependents": [
            {"name": "CustomersContracts"}
        ],
        "count": 1
    }
}
```

### Format de Réponse (avec site_id)

```json
{
    "data": {
        "module": "Customer",
        "dependents": [
            {
                "name": "CustomersContracts",
                "isActiveForTenant": true
            }
        ],
        "count": 1
    }
}
```

### Route

```php
Route::get('modules/{module}/dependents', [ModuleController::class, 'dependents'])
    ->middleware('throttle:superadmin-read')
    ->name('superadmin.modules.dependents');
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR38]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.8]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Ajouté méthode dependents(Request $request, string $module) au ModuleController
- ✅ Implémenté récupération des modules dépendants via ModuleDependencyResolver::getDependents()
- ✅ Ajouté support query param optionnel ?site_id=X pour filtrer par tenant
- ✅ Enrichissement des données avec statut isActiveForTenant quand site_id fourni
- ✅ Format de réponse structuré avec module, dependents array, et count
- ✅ Ajouté route GET /api/superadmin/modules/{module}/dependents avec throttling superadmin-read
- ✅ Ajouté import Request pour gérer les query parameters

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ModuleController.php (modifié)
- Modules/Superadmin/Routes/superadmin.php (modifié)

### Change Log
- 2026-01-28: Ajout API pour visualiser les modules dépendants d'un module donné avec support filtrage par tenant pour analyse d'impact avant désactivation

