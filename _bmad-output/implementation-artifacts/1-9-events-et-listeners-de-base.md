# Story 1.9: Events et Listeners de Base

**Status:** ready-for-dev

---

## Story

As a **développeur**,
I want **les events et listeners de base pour l'audit trail**,
so that **toutes les opérations importantes sont tracées**.

---

## Acceptance Criteria

1. **Given** le module Superadmin
   **When** je crée les events de base
   **Then** les events suivants existent:
   - `ModuleActivated`
   - `ModuleDeactivated`
   - `ModuleActivationFailed`
   - `ServiceConfigUpdated`

2. **Given** les events créés
   **When** je vérifie leur structure
   **Then** chaque event contient les données pertinentes (entity, user_id, metadata)

3. **Given** les events créés
   **When** ils sont dispatchés
   **Then** le listener `LogModuleActivation` enregistre dans activity_log

4. **Given** les events créés
   **When** ils sont dispatchés
   **Then** le listener `InvalidateModuleCache` invalide le cache concerné

---

## Tasks / Subtasks

- [ ] **Task 1: Créer les Events** (AC: #1, #2)
  - [ ] Créer `Modules/Superadmin/Events/ModuleActivated.php`
  - [ ] Créer `Modules/Superadmin/Events/ModuleDeactivated.php`
  - [ ] Créer `Modules/Superadmin/Events/ModuleActivationFailed.php`
  - [ ] Créer `Modules/Superadmin/Events/ServiceConfigUpdated.php`

- [ ] **Task 2: Créer les Listeners** (AC: #3, #4)
  - [ ] Créer `Modules/Superadmin/Listeners/LogModuleActivation.php`
  - [ ] Créer `Modules/Superadmin/Listeners/InvalidateModuleCache.php`

- [ ] **Task 3: Créer l'EventServiceProvider** (AC: #3, #4)
  - [ ] Créer `Modules/Superadmin/Providers/EventServiceProvider.php`
  - [ ] Enregistrer les mappings event → listeners
  - [ ] Enregistrer le provider dans SuperadminServiceProvider

- [ ] **Task 4: Tester les events** (AC: #1-4)
  - [ ] Écrire des tests unitaires pour chaque event
  - [ ] Tester le dispatch et l'exécution des listeners

---

## Dev Notes

### Structure Events

```
Modules/Superadmin/Events/
├── ModuleActivated.php
├── ModuleDeactivated.php
├── ModuleActivationFailed.php
└── ServiceConfigUpdated.php
```

### Code Event - ModuleActivated

```php
<?php

namespace Modules\Superadmin\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Superadmin\Entities\SiteModule;

class ModuleActivated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public SiteModule $siteModule,
        public int $activatedBy,
        public array $metadata = []
    ) {}
}
```

### Code Event - ModuleDeactivated

```php
<?php

namespace Modules\Superadmin\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Superadmin\Entities\SiteModule;

class ModuleDeactivated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public SiteModule $siteModule,
        public int $deactivatedBy,
        public array $metadata = []
    ) {}
}
```

### Code Event - ModuleActivationFailed

```php
<?php

namespace Modules\Superadmin\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ModuleActivationFailed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $siteId,
        public string $moduleName,
        public string $errorMessage,
        public array $completedSteps = [],
        public int $attemptedBy = 0
    ) {}
}
```

### Code Event - ServiceConfigUpdated

```php
<?php

namespace Modules\Superadmin\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Superadmin\Entities\ServiceConfig;

class ServiceConfigUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public ServiceConfig $serviceConfig,
        public int $updatedBy,
        public array $changedFields = []
    ) {}
}
```

### Code Listener - LogModuleActivation

```php
<?php

namespace Modules\Superadmin\Listeners;

use Modules\Superadmin\Events\ModuleActivated;
use Modules\Superadmin\Events\ModuleDeactivated;
use Modules\Superadmin\Events\ModuleActivationFailed;

class LogModuleActivation
{
    public function handleActivated(ModuleActivated $event): void
    {
        activity('superadmin')
            ->performedOn($event->siteModule)
            ->causedBy($event->activatedBy)
            ->withProperties([
                'module' => $event->siteModule->module_name,
                'tenant_id' => $event->siteModule->site_id,
                'metadata' => $event->metadata,
            ])
            ->log('Module activated');
    }

    public function handleDeactivated(ModuleDeactivated $event): void
    {
        activity('superadmin')
            ->performedOn($event->siteModule)
            ->causedBy($event->deactivatedBy)
            ->withProperties([
                'module' => $event->siteModule->module_name,
                'tenant_id' => $event->siteModule->site_id,
                'metadata' => $event->metadata,
            ])
            ->log('Module deactivated');
    }

    public function handleFailed(ModuleActivationFailed $event): void
    {
        activity('superadmin')
            ->causedBy($event->attemptedBy)
            ->withProperties([
                'module' => $event->moduleName,
                'tenant_id' => $event->siteId,
                'error' => $event->errorMessage,
                'completed_steps' => $event->completedSteps,
            ])
            ->log('Module activation failed');
    }
}
```

### Code Listener - InvalidateModuleCache

```php
<?php

namespace Modules\Superadmin\Listeners;

use Illuminate\Support\Facades\Cache;
use Modules\Superadmin\Events\ModuleActivated;
use Modules\Superadmin\Events\ModuleDeactivated;

class InvalidateModuleCache
{
    public function handle(ModuleActivated|ModuleDeactivated $event): void
    {
        $tenantId = $event->siteModule->site_id;

        // Invalider le cache du tenant
        Cache::forget("modules:tenant:{$tenantId}");

        // Invalider le cache global si nécessaire
        // Cache::forget('modules:available');
    }
}
```

### EventServiceProvider

```php
<?php

namespace Modules\Superadmin\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\Superadmin\Events\ModuleActivated;
use Modules\Superadmin\Events\ModuleDeactivated;
use Modules\Superadmin\Events\ModuleActivationFailed;
use Modules\Superadmin\Events\ServiceConfigUpdated;
use Modules\Superadmin\Listeners\LogModuleActivation;
use Modules\Superadmin\Listeners\InvalidateModuleCache;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        ModuleActivated::class => [
            [LogModuleActivation::class, 'handleActivated'],
            InvalidateModuleCache::class,
        ],
        ModuleDeactivated::class => [
            [LogModuleActivation::class, 'handleDeactivated'],
            InvalidateModuleCache::class,
        ],
        ModuleActivationFailed::class => [
            [LogModuleActivation::class, 'handleFailed'],
        ],
        ServiceConfigUpdated::class => [
            // Listeners à ajouter selon besoins
        ],
    ];
}
```

### Enregistrement dans SuperadminServiceProvider

```php
public function register(): void
{
    $this->app->register(RouteServiceProvider::class);
    $this->app->register(EventServiceProvider::class);
}
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.9]

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

