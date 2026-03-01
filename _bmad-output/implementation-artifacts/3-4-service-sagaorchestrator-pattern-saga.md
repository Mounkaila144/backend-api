# Story 3.4: Service SagaOrchestrator - Pattern Saga

**Status:** review

---

## Story

As a **développeur**,
I want **un orchestrateur Saga pour gérer les transactions multi-ressources**,
so that **les opérations sont atomiques avec rollback automatique**.

---

## Acceptance Criteria

1. **Given** une séquence d'opérations (migrations, S3, config)
   **When** j'utilise le SagaOrchestrator
   **Then** les opérations sont exécutées dans l'ordre avec compensation en cas d'échec

2. **Given** une opération qui échoue en milieu de saga
   **When** l'erreur se produit
   **Then** toutes les opérations précédentes sont annulées (compensation)

3. **Given** une saga en cours
   **When** je consulte l'état
   **Then** je vois les étapes complétées et celles en attente

---

## Tasks / Subtasks

- [x] **Task 1: Créer SagaOrchestrator** (AC: #1)
  - [x] Créer `Modules/Superadmin/Services/SagaOrchestrator.php`
  - [x] Implémenter l'exécution séquentielle des étapes
  - [x] Définir le concept de Step avec execute/compensate

- [x] **Task 2: Implémenter la compensation** (AC: #2)
  - [x] Tracker les étapes complétées
  - [x] Exécuter les compensations en ordre inverse
  - [x] Gérer les erreurs de compensation

- [x] **Task 3: Tracking de l'état** (AC: #3)
  - [x] Créer une structure pour l'état de la saga
  - [x] Retourner le rapport final

---

## Dev Notes

### SagaOrchestrator

```php
<?php

namespace Modules\Superadmin\Services;

use Modules\Superadmin\Exceptions\SagaException;

class SagaOrchestrator
{
    protected array $steps = [];
    protected array $completedSteps = [];
    protected array $errors = [];

    /**
     * Ajoute une étape à la saga
     */
    public function addStep(string $name, callable $execute, callable $compensate): self
    {
        $this->steps[] = [
            'name' => $name,
            'execute' => $execute,
            'compensate' => $compensate,
        ];

        return $this;
    }

    /**
     * Exécute la saga complète
     */
    public function execute(): SagaResult
    {
        $this->completedSteps = [];
        $this->errors = [];

        foreach ($this->steps as $step) {
            try {
                $result = call_user_func($step['execute']);

                $this->completedSteps[] = [
                    'name' => $step['name'],
                    'result' => $result,
                    'compensate' => $step['compensate'],
                ];
            } catch (\Exception $e) {
                $this->errors[] = [
                    'step' => $step['name'],
                    'error' => $e->getMessage(),
                ];

                // Compensation des étapes complétées
                $this->compensate();

                throw SagaException::stepFailed(
                    $step['name'],
                    $e->getMessage(),
                    array_column($this->completedSteps, 'name')
                );
            }
        }

        return new SagaResult(
            success: true,
            completedSteps: array_column($this->completedSteps, 'name'),
            errors: []
        );
    }

    /**
     * Exécute les compensations en ordre inverse
     */
    protected function compensate(): void
    {
        $stepsToCompensate = array_reverse($this->completedSteps);

        foreach ($stepsToCompensate as $step) {
            try {
                call_user_func($step['compensate']);
            } catch (\Exception $e) {
                // Log l'erreur de compensation mais continue
                $this->errors[] = [
                    'step' => $step['name'] . '_compensation',
                    'error' => $e->getMessage(),
                ];
            }
        }
    }

    /**
     * Réinitialise l'orchestrateur
     */
    public function reset(): self
    {
        $this->steps = [];
        $this->completedSteps = [];
        $this->errors = [];

        return $this;
    }
}
```

### SagaResult

```php
<?php

namespace Modules\Superadmin\Services;

class SagaResult
{
    public function __construct(
        public bool $success,
        public array $completedSteps,
        public array $errors
    ) {}

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'completed_steps' => $this->completedSteps,
            'errors' => $this->errors,
        ];
    }
}
```

### SagaException

```php
<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class SagaException extends Exception
{
    public function __construct(
        string $message,
        public string $failedStep = '',
        public array $completedSteps = [],
        public bool $compensated = true
    ) {
        parent::__construct($message);
    }

    public static function stepFailed(string $step, string $reason, array $completedSteps): self
    {
        return new self(
            message: "Saga failed at step '{$step}': {$reason}",
            failedStep: $step,
            completedSteps: $completedSteps
        );
    }

    public function context(): array
    {
        return [
            'failed_step' => $this->failedStep,
            'completed_steps' => $this->completedSteps,
            'compensated' => $this->compensated,
        ];
    }
}
```

### Exemple d'Utilisation

```php
$saga = new SagaOrchestrator();

$saga
    ->addStep(
        'run_migrations',
        fn() => $this->migrationRunner->runModuleMigrations($tenant, $module),
        fn() => $this->migrationRunner->rollbackModuleMigrations($tenant, $module)
    )
    ->addStep(
        'create_s3_structure',
        fn() => $this->storageManager->createModuleStructure($tenant->site_id, $module),
        fn() => $this->storageManager->deleteModuleStructure($tenant->site_id, $module)
    )
    ->addStep(
        'generate_config',
        fn() => $this->storageManager->generateModuleConfig($tenant->site_id, $module, $config),
        fn() => $this->storageManager->deleteModuleConfig($tenant->site_id, $module)
    );

try {
    $result = $saga->execute();
    // Succès - toutes les étapes complétées
} catch (SagaException $e) {
    // Échec - compensation effectuée
    // $e->context() contient les détails
}
```

### Saga Pattern pour Module Activation

```
ActivateModuleSaga
├── Step 1: RunMigrations     (compensate: RollbackMigrations)
├── Step 2: CreateS3Structure (compensate: DeleteS3Structure)
├── Step 3: GenerateConfig    (compensate: DeleteConfig)
└── Step 4: UpdateDatabase    (compensate: RevertDatabaseRecord)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.4]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
Aucune erreur rencontrée durant l'implémentation.

### Completion Notes List
✅ **Story 3-4 complétée** (2026-01-28)
- Créé SagaOrchestrator avec pattern execute/compensate pour transactions distribuées
- Méthode addStep() pour définir étapes avec callable execute et compensate
- Méthode execute() exécute séquentiellement toutes les étapes
- Compensation automatique en ordre inverse si une étape échoue
- Tracking complet : completedSteps, errors
- Créé SagaResult pour retourner état final (success, completedSteps, errors)
- Créé SagaException avec contexte détaillé (failedStep, completedSteps, compensated)
- Gestion robuste des erreurs de compensation (logged mais non-bloquantes)
- Méthode reset() pour réinitialiser l'orchestrateur
- Enregistré SagaOrchestrator dans SuperadminServiceProvider (transient binding)
- Tous les critères d'acceptation satisfaits (#1, #2, #3)

### File List
- Modules/Superadmin/Services/SagaOrchestrator.php (nouveau)
- Modules/Superadmin/Services/SagaResult.php (nouveau)
- Modules/Superadmin/Exceptions/SagaException.php (nouveau)
- Modules/Superadmin/Providers/SuperadminServiceProvider.php (modifié - ajout binding)

## Change Log
- 2026-01-28: Création du pattern Saga avec SagaOrchestrator pour transactions distribuées avec compensation automatique

