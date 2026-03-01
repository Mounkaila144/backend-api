# Story 5.5: API Configuration Database

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **visualiser et tester la configuration de la base de données**,
so that **je peux vérifier la connexion**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle `GET /api/superadmin/config/database`
   **Then** je reçois les infos de connexion (sans password)

2. **Given** une demande de test
   **When** j'appelle `POST /api/superadmin/config/database/test`
   **Then** je reçois le résultat du test

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter les méthodes au ServiceConfigController** (AC: #1, #2)
  - [x] `getDatabaseConfig`
  - [x] `testDatabaseConnection`

---

## Dev Notes

### Endpoints

```
GET  /api/superadmin/config/database
POST /api/superadmin/config/database/test
```

### Note

La config database n'est pas modifiable via l'API (elle vient de .env). On peut seulement la visualiser et tester.

### ServiceConfigController - Méthodes

```php
/**
 * GET /api/superadmin/config/database
 */
public function getDatabaseConfig(): JsonResponse
{
    // Lire depuis .env (masquer le password)
    $config = [
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => config('database.connections.mysql.database'),
        'username' => config('database.connections.mysql.username'),
        'password' => '********',
        'charset' => config('database.connections.mysql.charset'),
    ];

    return response()->json([
        'data' => $config,
        'note' => 'Database configuration is read-only (managed via .env)',
    ]);
}

/**
 * POST /api/superadmin/config/database/test
 */
public function testDatabaseConnection(): JsonResponse
{
    $result = $this->databaseChecker->check();

    return response()->json([
        'data' => $result->toArray(),
    ]);
}
```

### Routes

```php
Route::get('database', [ServiceConfigController::class, 'getDatabaseConfig'])
    ->middleware('throttle:superadmin-read');
Route::post('database/test', [ServiceConfigController::class, 'testDatabaseConnection'])
    ->middleware('throttle:superadmin-write');
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR45-FR49]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.5]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Ajouté getDatabaseConfig pour visualiser la config de la BDD centrale (password masqué)
- Ajouté testDatabaseConnection pour tester la connexion
- Config database est read-only (gérée via .env)
- Routes ajoutées avec throttling approprié

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php (modified)
- Modules/Superadmin/Routes/superadmin.php (modified)

