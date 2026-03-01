# Story 5.7: API Configuration Redis Cache

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **des endpoints pour visualiser et tester Redis Cache**,
so that **je peux vérifier le cache**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle `GET /api/superadmin/config/redis-cache`
   **Then** je reçois la config Redis cache

2. **Given** une demande de test
   **When** j'appelle `POST /api/superadmin/config/redis-cache/test`
   **Then** je reçois le résultat du test

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter les endpoints** (AC: #1, #2)
  - [x] GET et POST/test pour redis-cache

---

## Dev Notes

### Endpoints

```
GET  /api/superadmin/config/redis-cache
POST /api/superadmin/config/redis-cache/test
```

### ServiceConfigController

```php
/**
 * GET /api/superadmin/config/redis-cache
 */
public function getRedisCacheConfig(): JsonResponse
{
    $config = [
        'host' => config('database.redis.cache.host'),
        'port' => config('database.redis.cache.port'),
        'database' => config('database.redis.cache.database'),
        'password' => config('database.redis.cache.password') ? '********' : null,
        'prefix' => config('cache.prefix'),
    ];

    return response()->json([
        'data' => $config,
        'note' => 'Redis cache configuration is read-only (managed via .env)',
    ]);
}

/**
 * POST /api/superadmin/config/redis-cache/test
 */
public function testRedisCacheConnection(): JsonResponse
{
    $checker = RedisHealthChecker::forCache();
    $result = $checker->check();

    return response()->json([
        'data' => $result->toArray(),
    ]);
}
```

### Routes

```php
Route::get('redis-cache', [ServiceConfigController::class, 'getRedisCacheConfig'])
    ->middleware('throttle:superadmin-read');
Route::post('redis-cache/test', [ServiceConfigController::class, 'testRedisCacheConnection'])
    ->middleware('throttle:superadmin-write');
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR50-FR54]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.7]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Ajouté getRedisCacheConfig pour visualiser la config Redis cache (password masqué)
- Ajouté testRedisCacheConnection pour tester la connexion
- Config Redis cache est read-only (gérée via .env)
- Utilise RedisHealthChecker::forCache()

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php (modified)
- Modules/Superadmin/Routes/superadmin.php (modified)

