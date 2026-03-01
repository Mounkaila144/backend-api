# Story 6.6: Intégration spatie/laravel-health

**Status:** ready-for-dev

---

## Story

As a **développeur**,
I want **intégrer spatie/laravel-health pour les checks standards**,
so that **je bénéficie des checks prédéfinis du package**.

---

## Acceptance Criteria

1. **Given** le package spatie/laravel-health installé
   **When** je configure les checks
   **Then** les checks suivants sont activés:
   - `DatabaseCheck` (connexion centrale)
   - `RedisCheck` (cache et queue)
   - `EnvironmentCheck`
   - `UsedDiskSpaceCheck`

2. **Given** les checks personnalisés
   **Then** les checks custom (S3, SES, Meilisearch) sont ajoutés

3. **Given** le endpoint natif
   **Then** `/health` natif du package est accessible (optionnel)

---

## Tasks / Subtasks

- [x] **Task 1: Configurer spatie/laravel-health** (AC: #1)
  - [x] Publier config/health.php
  - [x] Configurer les checks standards

- [x] **Task 2: Créer les checks custom** (AC: #2)
  - [x] S3Check extends Spatie Check
  - [x] SesCheck extends Spatie Check
  - [x] MeilisearchCheck extends Spatie Check

- [x] **Task 3: Enregistrer les checks** (AC: #1, #2, #3)
  - [x] Dans SuperadminServiceProvider
  - [x] Configurer l'endpoint optionnel

---

## Dev Notes

### Configuration health.php

```php
<?php

// config/health.php
return [
    /*
     * A result store is responsible for saving the results of the health checks.
     */
    'result_stores' => [
        Spatie\Health\ResultStores\CacheHealthResultStore::class => [
            'store' => 'redis',
        ],
    ],

    /*
     * You can get notified when specific events occur.
     */
    'notifications' => [
        /*
         * Notifications will only get sent if this option is set to `true`.
         */
        'enabled' => false,
    ],

    /*
     * This determines how many seconds will pass before a new run of the checks.
     */
    'throttle_ttl_in_seconds' => 30,

    /*
     * The following checks will be run when the health check is executed.
     */
    'checks' => [
        // Les checks sont enregistrés dynamiquement dans le ServiceProvider
    ],
];
```

### Enregistrement dans SuperadminServiceProvider

```php
<?php

namespace Modules\Superadmin\Providers;

use Illuminate\Support\ServiceProvider;
use Spatie\Health\Facades\Health;
use Spatie\Health\Checks\Checks\DatabaseCheck;
use Spatie\Health\Checks\Checks\RedisCheck;
use Spatie\Health\Checks\Checks\EnvironmentCheck;
use Spatie\Health\Checks\Checks\UsedDiskSpaceCheck;
use Modules\Superadmin\Health\Checks\S3Check;
use Modules\Superadmin\Health\Checks\SesCheck;
use Modules\Superadmin\Health\Checks\MeilisearchCheck;

class SuperadminServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->registerHealthChecks();
    }

    protected function registerHealthChecks(): void
    {
        Health::checks([
            // Checks standards Spatie
            DatabaseCheck::new()
                ->name('database')
                ->connectionName('mysql'),

            RedisCheck::new()
                ->name('redis-cache')
                ->connectionName('cache'),

            RedisCheck::new()
                ->name('redis-queue')
                ->connectionName('queue'),

            EnvironmentCheck::new()
                ->name('environment'),

            UsedDiskSpaceCheck::new()
                ->name('disk-space')
                ->warnWhenUsedSpaceIsAbovePercentage(80)
                ->failWhenUsedSpaceIsAbovePercentage(90),

            // Checks custom
            S3Check::new()
                ->name('s3'),

            SesCheck::new()
                ->name('ses'),

            MeilisearchCheck::new()
                ->name('meilisearch'),
        ]);
    }
}
```

### S3Check Custom

```php
<?php

namespace Modules\Superadmin\Health\Checks;

use Spatie\Health\Checks\Check;
use Spatie\Health\Checks\Result;
use Modules\Superadmin\Services\Checkers\S3HealthChecker;

class S3Check extends Check
{
    public function run(): Result
    {
        $checker = app(S3HealthChecker::class);
        $checkResult = $checker->check();

        if ($checkResult->healthy) {
            return Result::make()
                ->ok($checkResult->message)
                ->meta([
                    'latencyMs' => $checkResult->latencyMs,
                    'bucket' => $checkResult->details['bucket'] ?? null,
                ]);
        }

        return Result::make()
            ->failed($checkResult->message)
            ->meta([
                'latencyMs' => $checkResult->latencyMs,
            ]);
    }
}
```

### SesCheck Custom

```php
<?php

namespace Modules\Superadmin\Health\Checks;

use Spatie\Health\Checks\Check;
use Spatie\Health\Checks\Result;
use Modules\Superadmin\Services\Checkers\SesHealthChecker;

class SesCheck extends Check
{
    public function run(): Result
    {
        $checker = app(SesHealthChecker::class);
        $checkResult = $checker->check();

        if ($checkResult->healthy) {
            return Result::make()
                ->ok($checkResult->message)
                ->meta([
                    'latencyMs' => $checkResult->latencyMs,
                    'region' => $checkResult->details['region'] ?? null,
                ]);
        }

        return Result::make()
            ->failed($checkResult->message)
            ->meta([
                'errorCode' => $checkResult->details['error_code'] ?? null,
            ]);
    }
}
```

### MeilisearchCheck Custom

```php
<?php

namespace Modules\Superadmin\Health\Checks;

use Spatie\Health\Checks\Check;
use Spatie\Health\Checks\Result;
use Modules\Superadmin\Services\Checkers\MeilisearchHealthChecker;

class MeilisearchCheck extends Check
{
    public function run(): Result
    {
        $checker = app(MeilisearchHealthChecker::class);
        $checkResult = $checker->check();

        if ($checkResult->healthy) {
            return Result::make()
                ->ok($checkResult->message)
                ->meta([
                    'latencyMs' => $checkResult->latencyMs,
                    'version' => $checkResult->details['version'] ?? null,
                ]);
        }

        return Result::make()
            ->failed($checkResult->message)
            ->meta([
                'latencyMs' => $checkResult->latencyMs,
            ]);
    }
}
```

### Routes Optionnelles Spatie

```php
// Dans routes/web.php (optionnel)
use Spatie\Health\Http\Controllers\HealthCheckResultsController;

Route::get('/health', HealthCheckResultsController::class);
```

### Structure des Fichiers

```
Modules/Superadmin/
├── Health/
│   └── Checks/
│       ├── S3Check.php
│       ├── SesCheck.php
│       └── MeilisearchCheck.php
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#NFRs - NFR-I3, NFR-I4]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.6]
- [Documentation: https://spatie.be/docs/laravel-health]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
N/A

### Completion Notes List
- ✅ Créé fichier de configuration config/health.php avec result stores Redis
- ✅ Créé S3Check custom qui utilise S3HealthChecker existant
- ✅ Créé SesCheck custom qui utilise SesHealthChecker existant
- ✅ Créé MeilisearchCheck custom qui utilise MeilisearchHealthChecker existant
- ✅ Enregistré tous les checks dans SuperadminServiceProvider:
  - Checks standards: DatabaseCheck, RedisCheck (cache/queue), EnvironmentCheck, UsedDiskSpaceCheck
  - Checks custom: S3Check, SesCheck, MeilisearchCheck
- ✅ Vérification class_exists pour éviter erreur si package non installé
- ⚠️ **IMPORTANT**: Le package spatie/laravel-health doit être installé via `composer require spatie/laravel-health`

### File List
- config/health.php
- Modules/Superadmin/Health/Checks/S3Check.php
- Modules/Superadmin/Health/Checks/SesCheck.php
- Modules/Superadmin/Health/Checks/MeilisearchCheck.php
- Modules/Superadmin/Providers/SuperadminServiceProvider.php

## Change Log
- 2026-01-28: Intégration de spatie/laravel-health avec checks standards et custom

## Status
**review**
