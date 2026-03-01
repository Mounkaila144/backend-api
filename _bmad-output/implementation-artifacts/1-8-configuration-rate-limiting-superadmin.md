# Story 1.8: Configuration Rate Limiting SuperAdmin

**Status:** ready-for-dev

---

## Story

As a **SuperAdmin**,
I want **que les endpoints API soient protégés par rate limiting**,
so that **le système est protégé contre les abus**.

---

## Acceptance Criteria

1. **Given** les routes SuperAdmin
   **When** je configure le rate limiting
   **Then** trois limiteurs sont définis:
   - `superadmin-read`: 100 requêtes/minute (GET)
   - `superadmin-write`: 30 requêtes/minute (POST/PUT config)
   - `superadmin-heavy`: 10 requêtes/minute (activation/désactivation)

2. **Given** les limiteurs configurés
   **When** ils sont appliqués aux routes
   **Then** les routes appropriées utilisent le bon limiteur

3. **Given** une limite dépassée
   **When** une requête supplémentaire est faite
   **Then** une réponse 429 est retournée avec le header Retry-After

---

## Tasks / Subtasks

- [ ] **Task 1: Configurer les Rate Limiters** (AC: #1)
  - [ ] Ajouter la configuration dans `bootstrap/app.php` ou `AppServiceProvider`
  - [ ] Définir `superadmin-read` (100/min)
  - [ ] Définir `superadmin-write` (30/min)
  - [ ] Définir `superadmin-heavy` (10/min)

- [ ] **Task 2: Appliquer aux routes** (AC: #2)
  - [ ] Documenter quel rate limiter utiliser pour chaque type de route
  - [ ] Préparer les middlewares pour les futures routes

- [ ] **Task 3: Tester les limites** (AC: #3)
  - [ ] Vérifier qu'une 429 est retournée quand limite dépassée
  - [ ] Vérifier le header Retry-After

---

## Dev Notes

### Configuration Rate Limiters

Dans `bootstrap/app.php` (Laravel 11+) ou `AppServiceProvider`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

// Dans boot() de AppServiceProvider ou dans bootstrap/app.php
RateLimiter::for('superadmin-read', function ($request) {
    return Limit::perMinute(100)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('superadmin-write', function ($request) {
    return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('superadmin-heavy', function ($request) {
    return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
});
```

### Application aux Routes

```php
// Routes lecture (GET)
Route::middleware(['auth:sanctum', 'throttle:superadmin-read'])->group(function () {
    Route::get('/modules', [ModuleController::class, 'index']);
    Route::get('/sites/{id}/modules', [ModuleController::class, 'tenantModules']);
    Route::get('/health', [HealthController::class, 'index']);
});

// Routes écriture légère (config)
Route::middleware(['auth:sanctum', 'throttle:superadmin-write'])->group(function () {
    Route::put('/config/s3', [ServiceConfigController::class, 'updateS3']);
    Route::put('/config/redis', [ServiceConfigController::class, 'updateRedis']);
});

// Routes opérations lourdes
Route::middleware(['auth:sanctum', 'throttle:superadmin-heavy'])->group(function () {
    Route::post('/sites/{id}/modules/{module}', [ModuleController::class, 'activate']);
    Route::delete('/sites/{id}/modules/{module}', [ModuleController::class, 'deactivate']);
});
```

### Mapping Rate Limiters par Type d'Endpoint

| Type d'Endpoint | Rate Limiter | Limite | Exemples |
|-----------------|--------------|--------|----------|
| Lecture (GET) | `superadmin-read` | 100/min | Liste modules, config, health |
| Écriture légère | `superadmin-write` | 30/min | Update config services |
| Opérations lourdes | `superadmin-heavy` | 10/min | Activation/désactivation modules |

### Réponse 429 Standard

Laravel retourne automatiquement:
- Status: 429 Too Many Requests
- Headers:
  - `Retry-After: X` (secondes)
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 0`

### Note

Les routes SuperAdmin n'existent pas encore. Cette story prépare les rate limiters pour les stories suivantes qui créeront les routes.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.8]

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

