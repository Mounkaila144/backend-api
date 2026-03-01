# Story 5.10: API Configuration Amazon SES

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **des endpoints pour configurer et tester Amazon SES**,
so that **je peux gérer l'envoi d'emails**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle `GET /api/superadmin/config/ses`
   **Then** je reçois la config SES

2. **Given** une nouvelle config
   **When** j'appelle `PUT /api/superadmin/config/ses`
   **Then** la config est sauvegardée

3. **Given** une demande de test
   **When** j'appelle `POST /api/superadmin/config/ses/test`
   **Then** je reçois le résultat du test

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter les endpoints** (AC: #1, #2, #3)
  - [x] GET, PUT, POST/test pour SES
  - [x] Créer `UpdateSesConfigRequest`

---

## Dev Notes

### Endpoints

```
GET  /api/superadmin/config/ses
PUT  /api/superadmin/config/ses
POST /api/superadmin/config/ses/test
```

### UpdateSesConfigRequest

```php
<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSesConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'access_key' => ['required', 'string'],
            'secret_key' => ['required', 'string'],
            'region' => ['required', 'string'],
            'from_address' => ['nullable', 'email'],
            'from_name' => ['nullable', 'string'],
        ];
    }
}
```

### Routes

```php
Route::get('ses', [ServiceConfigController::class, 'getSesConfig'])
    ->middleware('throttle:superadmin-read');
Route::put('ses', [ServiceConfigController::class, 'updateSesConfig'])
    ->middleware('throttle:superadmin-write');
Route::post('ses/test', [ServiceConfigController::class, 'testSesConnection'])
    ->middleware('throttle:superadmin-write');
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR60-FR64]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.10]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé UpdateSesConfigRequest pour valider la config SES
- Ajouté 3 endpoints: GET (récupération), PUT (sauvegarde), POST (test)
- Les secrets sont masqués dans les réponses GET
- Validation des champs: access_key, secret_key, region, from_address (optionnel)

### File List
- Modules/Superadmin/Http/Requests/UpdateSesConfigRequest.php (new)
- Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php (modified)
- Modules/Superadmin/Routes/superadmin.php (modified)

