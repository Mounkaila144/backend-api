# Story 2.7: API Graph Dépendances

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **voir le graphe des dépendances entre modules**,
so that **je comprends les relations entre modules**.

---

## Acceptance Criteria

1. **Given** je suis authentifié en tant que SuperAdmin
   **When** j'appelle `GET /api/superadmin/modules/dependencies`
   **Then** je reçois le graphe complet des dépendances

2. **Given** le graphe des dépendances
   **When** je consulte le format
   **Then** je vois pour chaque module ses dépendances et ses dépendants

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter la méthode au ModuleController** (AC: #1)
  - [x] Implémenter `dependencies()`
  - [x] Construire le graphe complet

- [x] **Task 2: Créer la Resource** (AC: #2)
  - [x] Pas nécessaire - format JSON simple directement dans le controller

- [x] **Task 3: Configurer la route** (AC: #1)
  - [x] Ajouter la route
  - [x] Appliquer le throttle

---

## Dev Notes

### Endpoint

```
GET /api/superadmin/modules/dependencies
```

### ModuleController - Méthode

```php
/**
 * Retourne le graphe des dépendances
 * GET /api/superadmin/modules/dependencies
 */
public function dependencies(): JsonResponse
{
    $modules = $this->moduleDiscovery->getActivatableModules();
    $graph = [];

    foreach ($modules as $module) {
        $graph[] = [
            'name' => $module['name'],
            'dependencies' => $module['dependencies'] ?? [],
            'dependents' => $this->dependencyResolver->getDependents($module['name']),
        ];
    }

    return response()->json(['data' => $graph]);
}
```

### Format de Réponse

```json
{
    "data": [
        {
            "name": "Customer",
            "dependencies": [],
            "dependents": ["CustomersContracts"]
        },
        {
            "name": "CustomersContracts",
            "dependencies": ["Customer"],
            "dependents": []
        },
        {
            "name": "Dashboard",
            "dependencies": [],
            "dependents": []
        }
    ]
}
```

### Route

```php
Route::get('modules/dependencies', [ModuleController::class, 'dependencies'])
    ->middleware('throttle:superadmin-read')
    ->name('superadmin.modules.dependencies');
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR35]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.7]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Ajouté ModuleDependencyResolverInterface dans les dépendances du ModuleController
- ✅ Implémenté méthode dependencies() retournant le graphe complet des dépendances
- ✅ Le graphe inclut pour chaque module: nom, dépendances directes, et modules dépendants
- ✅ Ajouté route GET /api/superadmin/modules/dependencies avec throttling superadmin-read
- ✅ Format de réponse simple et clair avec structure data[]
- ✅ Pas besoin de Resource dédiée - format JSON direct suffit pour cette API

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ModuleController.php (modifié)
- Modules/Superadmin/Routes/superadmin.php (modifié)

### Change Log
- 2026-01-28: Ajout API pour visualiser le graphe complet des dépendances entre modules avec structure claire name/dependencies/dependents

