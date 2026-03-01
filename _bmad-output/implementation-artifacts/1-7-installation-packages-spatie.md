# Story 1.7: Installation Packages Spatie

**Status:** ready-for-dev

---

## Story

As a **développeur**,
I want **installer et configurer spatie/laravel-activitylog et spatie/laravel-health**,
so that **l'audit trail et les health checks sont disponibles**.

---

## Acceptance Criteria

1. **Given** le projet Laravel
   **When** j'installe les packages Spatie
   **Then** spatie/laravel-activitylog est installé et configuré

2. **Given** le projet Laravel
   **When** j'installe les packages Spatie
   **Then** spatie/laravel-health est installé et configuré

3. **Given** spatie/laravel-activitylog installé
   **When** je vérifie les migrations
   **Then** les migrations activity_log sont publiées et exécutées

4. **Given** spatie/laravel-activitylog installé
   **When** je vérifie la configuration
   **Then** le fichier config/activitylog.php est configuré pour le canal superadmin

5. **Given** spatie/laravel-health installé
   **When** je vérifie la configuration
   **Then** le fichier config/health.php est créé

---

## Tasks / Subtasks

- [ ] **Task 1: Installer les packages** (AC: #1, #2)
  - [ ] Exécuter `composer require spatie/laravel-activitylog`
  - [ ] Exécuter `composer require spatie/laravel-health`
  - [ ] Vérifier la compatibilité des versions

- [ ] **Task 2: Configurer spatie/laravel-activitylog** (AC: #3, #4)
  - [ ] Publier les migrations: `php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"`
  - [ ] Exécuter les migrations
  - [ ] Publier la config: `php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-config"`
  - [ ] Configurer le log_name par défaut sur 'superadmin'

- [ ] **Task 3: Configurer spatie/laravel-health** (AC: #5)
  - [ ] Publier la config: `php artisan vendor:publish --provider="Spatie\Health\HealthServiceProvider" --tag="health-config"`
  - [ ] Configurer les checks de base (Database, Redis)
  - [ ] Optionnel: Configurer le endpoint `/health`

- [ ] **Task 4: Vérifier l'installation** (AC: #1-5)
  - [ ] Tester que activity() helper fonctionne
  - [ ] Tester un log d'activité
  - [ ] Vérifier la table activity_log en base

---

## Dev Notes

### Commandes d'Installation

```bash
# Installation des packages
composer require spatie/laravel-activitylog spatie/laravel-health

# Publication activitylog
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-config"
php artisan migrate

# Publication health
php artisan vendor:publish --provider="Spatie\Health\HealthServiceProvider" --tag="health-config"
```

### Configuration config/activitylog.php

```php
return [
    'enabled' => env('ACTIVITY_LOGGER_ENABLED', true),

    'delete_records_older_than_days' => 365,

    'default_log_name' => 'superadmin',  // Canal par défaut

    'default_auth_driver' => null,

    'subject_returns_soft_deleted_models' => false,

    'activity_model' => \Spatie\Activitylog\Models\Activity::class,

    'table_name' => 'activity_log',

    'database_connection' => env('ACTIVITY_LOGGER_DB_CONNECTION'),
];
```

### Usage de Activity Log

```php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class SiteModule extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['module_name', 'is_active'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $eventName) => "Module {$eventName}");
    }
}

// Usage manuel
activity('superadmin')
    ->performedOn($siteModule)
    ->causedBy(auth()->user())
    ->withProperties(['tenant_id' => $tenantId])
    ->log('Module activated');
```

### Configuration config/health.php (minimale pour l'instant)

```php
return [
    'result_stores' => [
        Spatie\Health\ResultStores\InMemoryHealthResultStore::class,
    ],

    'checks' => [
        Spatie\Health\Checks\Checks\DatabaseCheck::new(),
        Spatie\Health\Checks\Checks\RedisCheck::new(),
    ],
];
```

### Note sur la Table activity_log

La table `activity_log` sera créée par la migration Spatie. Elle utilise le schéma standard, pas le préfixe `t_` car c'est une table du package.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.7]

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

