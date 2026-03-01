# Story 3.7: Rollback Automatique Activation

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **que les activations échouées soient automatiquement annulées**,
so that **aucune donnée orpheline ne persiste**.

---

## Acceptance Criteria

1. **Given** une activation qui échoue à une étape
   **When** l'erreur se produit
   **Then** toutes les étapes précédentes sont compensées automatiquement

2. **Given** un rollback effectué
   **When** je vérifie l'état
   **Then** les migrations sont rollback, S3 nettoyé, config supprimée, pas d'entrée DB

3. **Given** un rollback
   **When** je consulte les logs
   **Then** l'event ModuleActivationFailed a été dispatché avec les détails

---

## Tasks / Subtasks

- [x] **Task 1: Vérifier la compensation** (AC: #1)
  - [x] Tester que la saga rollback correctement
  - [x] S'assurer que les compensations sont dans l'ordre inverse

- [x] **Task 2: Ajouter la suppression S3** (AC: #2)
  - [x] Implémenter `deleteModuleStructure()` dans TenantStorageManager
  - [x] Gérer la suppression récursive

- [x] **Task 3: Logging du rollback** (AC: #3)
  - [x] Vérifier que ModuleActivationFailed est dispatché
  - [x] Logger les détails du rollback

---

## Dev Notes

### Méthode deleteModuleStructure (TenantStorageManager)

```php
/**
 * Supprime la structure de fichiers d'un module
 */
public function deleteModuleStructure(int $tenantId, string $moduleName): void
{
    $basePath = $this->getModulePath($tenantId, $moduleName);

    try {
        Storage::disk($this->disk)->deleteDirectory($basePath);
    } catch (\Exception $e) {
        throw StorageException::deletionFailed($basePath, $e->getMessage());
    }
}

/**
 * Vérifie si des fichiers existent dans la structure du module
 */
public function hasModuleFiles(int $tenantId, string $moduleName): bool
{
    $files = $this->listModuleFiles($tenantId, $moduleName);
    return !empty($files);
}
```

### Vérification Post-Rollback

```php
// Test: Vérifier qu'il ne reste rien après rollback
public function test_rollback_cleans_everything()
{
    // Simuler une activation qui échoue à l'étape config
    // ...

    // Vérifier que les migrations sont rollback
    $this->assertFalse(
        $this->migrationRunner->areMigrationsRun($tenant, $module)
    );

    // Vérifier que S3 est vide
    $this->assertFalse(
        $this->storageManager->moduleStructureExists($tenant->site_id, $module)
    );

    // Vérifier que pas d'entrée en base
    $this->assertDatabaseMissing('t_site_modules', [
        'site_id' => $tenant->site_id,
        'module_name' => $module,
    ]);
}
```

### Séquence de Rollback

```
Activation échoue à l'étape 3 (generate_config):
1. ❌ generate_config échoue
2. ⏪ delete_s3_structure (compensation étape 2)
3. ⏪ rollback_migrations (compensation étape 1)
4. Event ModuleActivationFailed dispatché
5. Exception retournée au controller
```

### Logging

```php
$this->logError('Module activation failed - rollback completed', [
    'tenant_id' => $tenant->site_id,
    'module' => $moduleName,
    'failed_step' => $e->failedStep,
    'compensated_steps' => $e->completedSteps,
    'error' => $e->getMessage(),
]);
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR28-FR32]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.7]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
Aucune erreur rencontrée durant l'implémentation.

### Completion Notes List
✅ **Story 3-7 complétée** (2026-01-28)

**IMPORTANT : Le rollback automatique était déjà complètement implémenté dans les stories précédentes !**

✅ **Déjà implémenté dans Story 3-4 (SagaOrchestrator)** :
- Méthode compensate() exécute automatiquement les compensations en ordre inverse
- Gestion robuste des erreurs de compensation (logged mais non-bloquantes)
- Tracking complet des étapes complétées et compensées

✅ **Déjà implémenté dans Story 3-5 (ModuleInstaller)** :
- deleteModuleStructure() déjà créée pour compensation S3
- Event ModuleActivationFailed dispatché avec tous les détails (failedStep, completedSteps)
- Logging complet via LogsSuperadminActivity trait
- Saga construite avec 3 étapes et leurs compensations respectives

✅ **Ajouté dans cette story** :
- Méthode hasModuleFiles() pour vérifier si des fichiers existent après rollback
- Documentation complète du mécanisme de rollback

**Séquence de rollback automatique :**
1. Étape X échoue → Exception levée
2. SagaOrchestrator.compensate() appelé automatiquement
3. Compensations exécutées en ordre inverse (LIFO) : Step 3 → Step 2 → Step 1
4. Event ModuleActivationFailed dispatché avec context complet
5. Logs créés avec détails du rollback
6. ModuleActivationException retournée au controller

- Tous les critères d'acceptation satisfaits (#1, #2, #3)

### File List
- Modules/Superadmin/Services/TenantStorageManagerInterface.php (modifié - ajout hasModuleFiles)
- Modules/Superadmin/Services/TenantStorageManager.php (modifié - implémentation hasModuleFiles)

## Change Log
- 2026-01-28: Ajout méthode hasModuleFiles() - Le mécanisme de rollback automatique était déjà complet dans les stories 3-4 et 3-5

