# Story 4.1: Service TenantStorageManager - Suppression S3

**Status:** review

---

## Story

As a **développeur**,
I want **supprimer la structure de fichiers S3 d'un module**,
so that **les fichiers sont nettoyés lors de la désactivation**.

---

## Acceptance Criteria

1. **Given** un module avec des fichiers sur S3
   **When** j'appelle `deleteModuleStructure($tenant, $module)`
   **Then** tous les fichiers et dossiers du module sont supprimés

2. **Given** la suppression effectuée
   **When** je vérifie S3
   **Then** le dossier `tenants/{tenant_id}/modules/{module}/` n'existe plus

3. **Given** une erreur S3
   **When** la suppression échoue
   **Then** une `StorageException` est levée

---

## Tasks / Subtasks

- [x] **Task 1: Implémenter deleteModuleStructure** (AC: #1, #2)
  - [x] Supprimer récursivement tous les fichiers
  - [x] Supprimer le dossier racine du module

- [x] **Task 2: Supprimer la config** (AC: #1)
  - [x] Implémenter ou vérifier `deleteModuleConfig()`

- [x] **Task 3: Gérer les erreurs** (AC: #3)
  - [x] Logger les erreurs de suppression
  - [x] Lever l'exception appropriée

---

## Dev Notes

### Méthodes à Implémenter/Vérifier

```php
/**
 * Supprime la structure de fichiers d'un module
 */
public function deleteModuleStructure(int $tenantId, string $moduleName): void
{
    $basePath = $this->getModulePath($tenantId, $moduleName);

    if (!Storage::disk($this->disk)->exists($basePath)) {
        return; // Rien à supprimer
    }

    try {
        // Supprimer tous les fichiers d'abord
        $files = Storage::disk($this->disk)->allFiles($basePath);
        foreach ($files as $file) {
            Storage::disk($this->disk)->delete($file);
        }

        // Supprimer les dossiers
        Storage::disk($this->disk)->deleteDirectory($basePath);

        $this->logInfo('Module storage deleted', [
            'tenant_id' => $tenantId,
            'module' => $moduleName,
            'files_deleted' => count($files),
        ]);
    } catch (\Exception $e) {
        throw StorageException::deletionFailed($basePath, $e->getMessage());
    }
}

/**
 * Compte les fichiers avant suppression
 */
public function countModuleFiles(int $tenantId, string $moduleName): int
{
    return count($this->listModuleFiles($tenantId, $moduleName));
}
```

### Attention

La suppression est irréversible. Toujours proposer un backup avant (Story 4.2).

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Module-Lifecycle]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Amélioré `deleteModuleStructure()` avec suppression récursive explicite des fichiers
- ✅ Ajout du comptage des fichiers supprimés et logging complet
- ✅ Vérification de l'existence avant suppression pour éviter les erreurs
- ✅ Amélioré `deleteModuleConfig()` avec logging approprié
- ✅ Ajout de la méthode `countModuleFiles()` pour compter les fichiers d'un module
- ✅ Intégration du trait `LogsSuperadminActivity` pour le logging
- ✅ Gestion des erreurs avec logging et exceptions `StorageException`

### File List
- Modules/Superadmin/Services/TenantStorageManager.php
- Modules/Superadmin/Services/TenantStorageManagerInterface.php

## Change Log
- 2026-01-28: Implémentation de la suppression S3 avec logging et gestion d'erreurs complète

