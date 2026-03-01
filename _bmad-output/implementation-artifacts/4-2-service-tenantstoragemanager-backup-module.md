# Story 4.2: Service TenantStorageManager - Backup Module

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **créer un backup des fichiers d'un module avant suppression**,
so that **les données peuvent être restaurées si nécessaire**.

---

## Acceptance Criteria

1. **Given** un module avec des fichiers
   **When** j'appelle `backupModule($tenant, $module)`
   **Then** un fichier ZIP est créé dans le bucket de backup

2. **Given** un backup créé
   **When** je vérifie le chemin
   **Then** il est stocké dans `tenants/{tenant_id}/backup_{module}_{date}.zip`

3. **Given** un backup
   **When** je liste les backups d'un tenant
   **Then** je vois tous les backups avec dates et tailles

---

## Tasks / Subtasks

- [x] **Task 1: Implémenter backupModule** (AC: #1, #2)
  - [x] Créer un ZIP des fichiers du module
  - [x] Stocker dans le bucket de backup

- [x] **Task 2: Gérer les métadonnées** (AC: #2)
  - [x] Nommer avec date/timestamp
  - [x] Stocker les infos de taille

- [x] **Task 3: Lister les backups** (AC: #3)
  - [x] Implémenter `listBackups($tenantId)`
  - [x] Retourner date, taille, module

---

## Dev Notes

### Méthodes à Implémenter

```php
/**
 * Crée un backup des fichiers d'un module
 */
public function backupModule(int $tenantId, string $moduleName): string
{
    $sourcePath = $this->getModulePath($tenantId, $moduleName);
    $date = now()->format('Y-m-d_His');
    $backupName = "backup_{$moduleName}_{$date}.zip";
    $backupPath = "tenants/{$tenantId}/backups/{$backupName}";

    // Récupérer tous les fichiers
    $files = Storage::disk($this->disk)->allFiles($sourcePath);

    if (empty($files)) {
        throw StorageException::backupFailed($sourcePath, 'No files to backup');
    }

    try {
        // Créer le ZIP en mémoire
        $zip = new \ZipArchive();
        $tempPath = tempnam(sys_get_temp_dir(), 'backup_');
        $zip->open($tempPath, \ZipArchive::CREATE);

        foreach ($files as $file) {
            $content = Storage::disk($this->disk)->get($file);
            $relativePath = str_replace($sourcePath . '/', '', $file);
            $zip->addFromString($relativePath, $content);
        }

        $zip->close();

        // Upload vers S3
        Storage::disk($this->disk)->put($backupPath, file_get_contents($tempPath));

        // Nettoyer
        unlink($tempPath);

        $this->logInfo('Module backup created', [
            'tenant_id' => $tenantId,
            'module' => $moduleName,
            'backup_path' => $backupPath,
            'files_count' => count($files),
        ]);

        return $backupPath;

    } catch (\Exception $e) {
        throw StorageException::backupFailed($sourcePath, $e->getMessage());
    }
}

/**
 * Liste les backups d'un tenant
 */
public function listBackups(int $tenantId, ?string $moduleName = null): array
{
    $path = "tenants/{$tenantId}/backups/";
    $files = Storage::disk($this->disk)->files($path);

    $backups = [];
    foreach ($files as $file) {
        if ($moduleName && !str_contains($file, "backup_{$moduleName}_")) {
            continue;
        }

        $backups[] = [
            'path' => $file,
            'name' => basename($file),
            'size' => Storage::disk($this->disk)->size($file),
            'created_at' => Storage::disk($this->disk)->lastModified($file),
        ];
    }

    return $backups;
}

/**
 * Supprime un backup
 */
public function deleteBackup(string $backupPath): void
{
    Storage::disk($this->disk)->delete($backupPath);
}
```

### Structure Backup

```
tenants/{tenant_id}/backups/
├── backup_CustomersContracts_2026-01-28_103000.zip
├── backup_Customer_2026-01-25_140000.zip
└── ...
```

### Format de Réponse listBackups

```php
[
    [
        'path' => 'tenants/1/backups/backup_CustomersContracts_2026-01-28_103000.zip',
        'name' => 'backup_CustomersContracts_2026-01-28_103000.zip',
        'size' => 1024000,
        'created_at' => 1706434200,
    ],
]
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR20]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Implémenté `backupModule()` pour créer des ZIP des fichiers de modules
- ✅ Gestion du nommage avec date/timestamp (format: backup_{module}_{Y-m-d_His}.zip)
- ✅ Stockage des backups dans tenants/{tenant_id}/backups/
- ✅ Implémenté `listBackups()` avec filtrage optionnel par module
- ✅ Implémenté `deleteBackup()` pour supprimer les anciens backups
- ✅ Logging complet de toutes les opérations (succès et erreurs)
- ✅ Gestion des fichiers temporaires avec nettoyage automatique
- ✅ Retour des métadonnées complètes: path, name, size, created_at

### File List
- Modules/Superadmin/Services/TenantStorageManager.php
- Modules/Superadmin/Services/TenantStorageManagerInterface.php

## Change Log
- 2026-01-28: Implémentation du système de backup avec création de ZIP et gestion des métadonnées

