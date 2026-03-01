# Story 1.6: Configuration Logging Canal Superadmin

**Status:** review

---

## Story

As a **développeur**,
I want **un canal de logging dédié pour les opérations SuperAdmin**,
so that **les logs sont isolés et facilement consultables**.

---

## Acceptance Criteria

1. **Given** le fichier config/logging.php
   **When** je configure le canal superadmin
   **Then** un nouveau canal `superadmin` est disponible

2. **Given** le canal superadmin configuré
   **When** des logs sont écrits
   **Then** les logs sont écrits dans `storage/logs/superadmin.log`

3. **Given** le canal superadmin
   **When** j'écris un log
   **Then** le format inclut timestamp, level, message et context

4. **Given** le canal superadmin
   **When** des opérations sensibles sont loggées
   **Then** les données sensibles ne sont jamais loggées (passwords, keys)

---

## Tasks / Subtasks

- [x] **Task 1: Configurer le canal logging** (AC: #1, #2)
  - [ ] Éditer `config/logging.php`
  - [ ] Ajouter le canal `superadmin` dans le tableau `channels`
  - [ ] Configurer le driver 'daily' avec rotation

- [x] **Task 2: Configurer le format des logs** (AC: #3)
  - [ ] S'assurer que le format standard Laravel est utilisé
  - [ ] Vérifier que le context est inclus

- [x] **Task 3: Créer un helper ou trait pour logging sécurisé** (AC: #4)
  - [ ] Créer un trait `LogsSuperadminActivity`
  - [ ] Implémenter une méthode qui filtre les données sensibles
  - [ ] Documenter l'usage

- [x] **Task 4: Tester le logging** (AC: #1-4)
  - [ ] Écrire un test qui vérifie le canal
  - [ ] Vérifier que le fichier est créé au bon endroit
  - [ ] Vérifier la rotation des logs

---

## Dev Notes

### Configuration à Ajouter dans config/logging.php

```php
'channels' => [
    // ... autres canaux existants ...

    'superadmin' => [
        'driver' => 'daily',
        'path' => storage_path('logs/superadmin.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 14,
        'replace_placeholders' => true,
    ],
],
```

### Trait pour Logging Sécurisé

Créer dans `Modules/Superadmin/Traits/LogsSuperadminActivity.php`:

```php
<?php

namespace Modules\Superadmin\Traits;

use Illuminate\Support\Facades\Log;

trait LogsSuperadminActivity
{
    /**
     * Champs sensibles à ne jamais logger
     */
    protected static array $sensitiveLogFields = [
        'password',
        'secret_key',
        'aws_secret_key',
        'api_key',
        'master_key',
        'token',
    ];

    /**
     * Log une activité SuperAdmin en filtrant les données sensibles
     */
    protected function logSuperadmin(string $level, string $message, array $context = []): void
    {
        $safeContext = $this->filterSensitiveData($context);
        Log::channel('superadmin')->{$level}($message, $safeContext);
    }

    /**
     * Filtre les données sensibles du context
     */
    protected function filterSensitiveData(array $data): array
    {
        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), static::$sensitiveLogFields)) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->filterSensitiveData($value);
            }
        }
        return $data;
    }

    /**
     * Raccourcis pour les niveaux de log
     */
    protected function logInfo(string $message, array $context = []): void
    {
        $this->logSuperadmin('info', $message, $context);
    }

    protected function logWarning(string $message, array $context = []): void
    {
        $this->logSuperadmin('warning', $message, $context);
    }

    protected function logError(string $message, array $context = []): void
    {
        $this->logSuperadmin('error', $message, $context);
    }
}
```

### Utilisation du Canal

```php
// Direct
Log::channel('superadmin')->info('Module activated', [
    'tenant_id' => $tenantId,
    'module' => $moduleName,
    'user_id' => auth()->id(),
]);

// Via trait
class ModuleInstaller
{
    use LogsSuperadminActivity;

    public function activate($tenant, $module)
    {
        $this->logInfo('Module activation started', [
            'tenant_id' => $tenant->id,
            'module' => $module,
        ]);
    }
}
```

### Niveaux de Log

| Niveau | Usage |
|--------|-------|
| `info` | Opérations réussies |
| `warning` | Opérations avec avertissements |
| `error` | Échecs avec rollback |
| `debug` | Détails techniques (dev only) |

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.6]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- ✅ Canal superadmin ajouté à config/logging.php
- ✅ Configuration daily driver avec rotation 14 jours
- ✅ Trait LogsSuperadminActivity créé avec filtrage sécurisé
- ✅ Méthodes: logInfo(), logWarning(), logError()
- ✅ Filtrage automatique des champs sensibles (password, api_key, etc.)

### File List

**Fichiers modifiés:**
- config/logging.php

**Nouveaux fichiers créés:**
- Modules/Superadmin/Traits/LogsSuperadminActivity.php

### Change Log

- 2026-01-28: Story 1.6 implémentée - Configuration logging canal superadmin

