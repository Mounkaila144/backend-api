# Story 5.8: API Configuration Redis Queue

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **des endpoints pour visualiser et tester Redis Queue**,
so that **je peux vérifier les queues**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle `GET /api/superadmin/config/redis-queue`
   **Then** je reçois la config Redis queue

2. **Given** une demande de test
   **When** j'appelle `POST /api/superadmin/config/redis-queue/test`
   **Then** je reçois le résultat du test

---

## Tasks / Subtasks

- [x] **Task 1: Ajouter les endpoints** (AC: #1, #2)
  - [x] GET et POST/test pour redis-queue

---

## Dev Notes

### Endpoints

```
GET  /api/superadmin/config/redis-queue
POST /api/superadmin/config/redis-queue/test
```

### ServiceConfigController

```php
/**
 * GET /api/superadmin/config/redis-queue
 */
public function getRedisQueueConfig(): JsonResponse
{
    $config = [
        'host' => config('database.redis.queue.host', config('database.redis.default.host')),
        'port' => config('database.redis.queue.port', config('database.redis.default.port')),
        'database' => config('database.redis.queue.database', 1),
        'password' => config('database.redis.queue.password') ? '********' : null,
        'queue' => config('queue.connections.redis.queue', 'default'),
    ];

    return response()->json([
        'data' => $config,
        'note' => 'Redis queue configuration is read-only (managed via .env)',
    ]);
}

/**
 * POST /api/superadmin/config/redis-queue/test
 */
public function testRedisQueueConnection(): JsonResponse
{
    $checker = RedisHealthChecker::forQueue();
    $result = $checker->check();

    return response()->json([
        'data' => $result->toArray(),
    ]);
}
```

### Routes

```php
Route::get('redis-queue', [ServiceConfigController::class, 'getRedisQueueConfig'])
    ->middleware('throttle:superadmin-read');
Route::post('redis-queue/test', [ServiceConfigController::class, 'testRedisQueueConnection'])
    ->middleware('throttle:superadmin-write');
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR55-FR59]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.8]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Ajouté getRedisQueueConfig pour visualiser la config Redis queue (password masqué)
- Ajouté testRedisQueueConnection pour tester la connexion
- Config Redis queue est read-only (gérée via .env)
- Utilise RedisHealthChecker::forQueue()

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php (modified)
- Modules/Superadmin/Routes/superadmin.php (modified)

