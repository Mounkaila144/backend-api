# Story 3.1: Service TenantStorageManager - Création Structure S3

**Status:** review

---

## Story

As a **développeur**,
I want **créer automatiquement la structure de fichiers S3 pour un module**,
so that **le module dispose de son espace de stockage isolé**.

---

## Acceptance Criteria

1. **Given** un tenant et un module à activer
   **When** j'appelle `createModuleStructure($tenant, $module)`
   **Then** la structure `tenants/{tenant_id}/modules/{module}/` est créée sur S3

2. **Given** la structure créée
   **When** je vérifie les sous-dossiers
   **Then** les dossiers standards sont créés (uploads/, templates/, etc.)

3. **Given** une erreur S3
   **When** la création échoue
   **Then** une exception `StorageException` est levée avec détails

---

## Tasks / Subtasks

- [x] **Task 1: Créer TenantStorageManager** (AC: #1)
  - [x] Créer `Modules/Superadmin/Services/TenantStorageManager.php`
  - [x] Implémenter `createModuleStructure()`
  - [x] Utiliser `Storage::disk('s3')`

- [x] **Task 2: Créer les sous-dossiers standards** (AC: #2)
  - [x] Définir les sous-dossiers par module
  - [x] Créer la structure complète

- [x] **Task 3: Gérer les erreurs** (AC: #3)
  - [x] Créer `StorageException`
  - [x] Wrapper les appels S3

---

## Dev Notes

### TenantStorageManager

```php
<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Facades\Storage;
use Modules\Superadmin\Exceptions\StorageException;

class TenantStorageManager implements TenantStorageManagerInterface
{
    protected string $disk = 's3';

    /**
     * Structure de dossiers standard par module
     */
    protected array $standardFolders = [
        'uploads',
        'templates',
        'exports',
        'temp',
    ];

    /**
     * Crée la structure de fichiers pour un module
     */
    public function createModuleStructure(int $tenantId, string $moduleName): void
    {
        $basePath = $this->getModulePath($tenantId, $moduleName);

        try {
            // Créer le dossier racine du module
            Storage::disk($this->disk)->makeDirectory($basePath);

            // Créer les sous-dossiers standards
            foreach ($this->standardFolders as $folder) {
                Storage::disk($this->disk)->makeDirectory("{$basePath}/{$folder}");
            }
        } catch (\Exception $e) {
            throw StorageException::creationFailed($basePath, $e->getMessage());
        }
    }

    /**
     * Vérifie si la structure du module existe
     */
    public function moduleStructureExists(int $tenantId, string $moduleName): bool
    {
        $basePath = $this->getModulePath($tenantId, $moduleName);
        return Storage::disk($this->disk)->exists($basePath);
    }

    /**
     * Retourne le chemin de base pour un module d'un tenant
     */
    public function getModulePath(int $tenantId, string $moduleName): string
    {
        return "tenants/{$tenantId}/modules/{$moduleName}";
    }

    /**
     * Retourne le chemin de base pour un tenant
     */
    public function getTenantPath(int $tenantId): string
    {
        return "tenants/{$tenantId}";
    }

    /**
     * Liste les fichiers d'un module
     */
    public function listModuleFiles(int $tenantId, string $moduleName): array
    {
        $path = $this->getModulePath($tenantId, $moduleName);
        return Storage::disk($this->disk)->allFiles($path);
    }

    /**
     * Retourne la taille totale d'un module en bytes
     */
    public function getModuleSize(int $tenantId, string $moduleName): int
    {
        $files = $this->listModuleFiles($tenantId, $moduleName);
        $totalSize = 0;

        foreach ($files as $file) {
            $totalSize += Storage::disk($this->disk)->size($file);
        }

        return $totalSize;
    }
}
```

### StorageException

```php
<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class StorageException extends Exception
{
    public static function creationFailed(string $path, string $reason): self
    {
        return new self("Failed to create storage structure at '{$path}': {$reason}");
    }

    public static function deletionFailed(string $path, string $reason): self
    {
        return new self("Failed to delete storage at '{$path}': {$reason}");
    }

    public static function backupFailed(string $path, string $reason): self
    {
        return new self("Failed to backup storage at '{$path}': {$reason}");
    }
}
```

### Structure S3 Créée

```
tenants/{tenant_id}/modules/{module}/
├── uploads/
├── templates/
├── exports/
└── temp/
```

### Configuration Laravel S3

```php
// config/filesystems.php
'disks' => [
    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
        'endpoint' => env('AWS_ENDPOINT'), // Pour Minio
        'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    ],
],
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Storage-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
Aucune erreur rencontrée durant l'implémentation.

### Completion Notes List
✅ **Story 3-1 complétée** (2026-01-28)
- Créé TenantStorageManagerInterface avec toutes les méthodes de gestion du storage S3
- Implémenté TenantStorageManager avec création automatique de structure de dossiers
- Structure créée : `tenants/{tenant_id}/modules/{module}/` avec sous-dossiers : uploads/, templates/, exports/, temp/
- Créé StorageException avec méthodes statiques pour erreurs de création, suppression et backup
- Enregistré TenantStorageManager dans SuperadminServiceProvider pour injection de dépendances
- Tous les critères d'acceptation satisfaits (#1, #2, #3)

### File List
- Modules/Superadmin/Services/TenantStorageManagerInterface.php (nouveau)
- Modules/Superadmin/Services/TenantStorageManager.php (nouveau)
- Modules/Superadmin/Exceptions/StorageException.php (nouveau)
- Modules/Superadmin/Providers/SuperadminServiceProvider.php (modifié - ajout binding)

## Change Log
- 2026-01-28: Création du service TenantStorageManager pour la gestion automatique de la structure S3 des modules tenant

