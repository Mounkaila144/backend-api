# Story 5.12: API Configuration Meilisearch

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **des endpoints pour configurer et tester Meilisearch**,
so that **je peux gérer la recherche**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle les endpoints Meilisearch
   **Then** je peux GET, PUT et tester la config

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter les endpoints** (AC: #1)
  - [x] GET, PUT, POST/test pour Meilisearch
  - [x] Créer `UpdateMeilisearchConfigRequest`

---

## Dev Notes

### Endpoints

```
GET  /api/superadmin/config/meilisearch
PUT  /api/superadmin/config/meilisearch
POST /api/superadmin/config/meilisearch/test
```

### UpdateMeilisearchConfigRequest

```php
<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMeilisearchConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'url' => ['required', 'url'],
            'api_key' => ['required', 'string'],
            'index_prefix' => ['nullable', 'string'],
        ];
    }
}
```

### Routes

```php
Route::get('meilisearch', [ServiceConfigController::class, 'getMeilisearchConfig'])
    ->middleware('throttle:superadmin-read');
Route::put('meilisearch', [ServiceConfigController::class, 'updateMeilisearchConfig'])
    ->middleware('throttle:superadmin-write');
Route::post('meilisearch/test', [ServiceConfigController::class, 'testMeilisearchConnection'])
    ->middleware('throttle:superadmin-write');
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR65-FR69]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.12]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé UpdateMeilisearchConfigRequest pour valider la config Meilisearch
- Ajouté 3 endpoints: GET (récupération), PUT (sauvegarde), POST (test)
- Les secrets (api_key) sont masqués dans les réponses GET
- Validation des champs: url, api_key, index_prefix (optionnel)

### File List
- Modules/Superadmin/Http/Requests/UpdateMeilisearchConfigRequest.php (new)
- Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php (modified)
- Modules/Superadmin/Routes/superadmin.php (modified)

