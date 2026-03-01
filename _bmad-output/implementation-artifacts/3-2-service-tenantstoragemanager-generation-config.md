# Story 3.2: Service TenantStorageManager - Génération Config

**Status:** review

---

## Story

As a **développeur**,
I want **générer automatiquement les fichiers de configuration sur S3**,
so that **le module a sa configuration persistée**.

---

## Acceptance Criteria

1. **Given** un module activé
   **When** j'appelle `generateModuleConfig($tenant, $module, $config)`
   **Then** le fichier `tenants/{tenant_id}/config/module_{module}.json` est créé

2. **Given** un fichier de config existant
   **When** je mets à jour la config
   **Then** le fichier est écrasé avec la nouvelle version

3. **Given** une config avec des données sensibles
   **When** le fichier est créé
   **Then** les données sensibles sont chiffrées

---

## Tasks / Subtasks

- [x] **Task 1: Implémenter generateModuleConfig** (AC: #1)
  - [x] Ajouter la méthode à TenantStorageManager
  - [x] Créer le fichier JSON sur S3

- [x] **Task 2: Gérer les mises à jour** (AC: #2)
  - [x] Implémenter `updateModuleConfig()`
  - [x] Écraser le fichier existant

- [x] **Task 3: Sécuriser les données sensibles** (AC: #3)
  - [x] Chiffrer les champs sensibles avant écriture
  - [x] Déchiffrer à la lecture

---

## Dev Notes

### Méthodes à Ajouter à TenantStorageManager

```php
/**
 * Génère le fichier de configuration pour un module
 */
public function generateModuleConfig(int $tenantId, string $moduleName, array $config = []): void
{
    $configPath = $this->getConfigPath($tenantId, $moduleName);

    // Chiffrer les données sensibles
    $secureConfig = $this->encryptSensitiveData($config);

    try {
        Storage::disk($this->disk)->put(
            $configPath,
            json_encode($secureConfig, JSON_PRETTY_PRINT)
        );
    } catch (\Exception $e) {
        throw StorageException::creationFailed($configPath, $e->getMessage());
    }
}

/**
 * Met à jour la configuration d'un module
 */
public function updateModuleConfig(int $tenantId, string $moduleName, array $config): void
{
    $this->generateModuleConfig($tenantId, $moduleName, $config);
}

/**
 * Lit la configuration d'un module
 */
public function readModuleConfig(int $tenantId, string $moduleName): ?array
{
    $configPath = $this->getConfigPath($tenantId, $moduleName);

    if (!Storage::disk($this->disk)->exists($configPath)) {
        return null;
    }

    $content = Storage::disk($this->disk)->get($configPath);
    $config = json_decode($content, true);

    // Déchiffrer les données sensibles
    return $this->decryptSensitiveData($config);
}

/**
 * Supprime la configuration d'un module
 */
public function deleteModuleConfig(int $tenantId, string $moduleName): void
{
    $configPath = $this->getConfigPath($tenantId, $moduleName);

    try {
        Storage::disk($this->disk)->delete($configPath);
    } catch (\Exception $e) {
        throw StorageException::deletionFailed($configPath, $e->getMessage());
    }
}

/**
 * Retourne le chemin du fichier de config
 */
protected function getConfigPath(int $tenantId, string $moduleName): string
{
    return "tenants/{$tenantId}/config/module_{$moduleName}.json";
}

/**
 * Champs sensibles à chiffrer dans les configs
 */
protected array $sensitiveConfigFields = [
    'api_key',
    'secret',
    'password',
    'token',
];

/**
 * Chiffre les données sensibles
 */
protected function encryptSensitiveData(array $config): array
{
    foreach ($this->sensitiveConfigFields as $field) {
        if (isset($config[$field]) && !empty($config[$field])) {
            $config[$field] = Crypt::encryptString($config[$field]);
        }
    }
    return $config;
}

/**
 * Déchiffre les données sensibles
 */
protected function decryptSensitiveData(array $config): array
{
    foreach ($this->sensitiveConfigFields as $field) {
        if (isset($config[$field]) && !empty($config[$field])) {
            try {
                $config[$field] = Crypt::decryptString($config[$field]);
            } catch (\Exception $e) {
                // Valeur non chiffrée, garder telle quelle
            }
        }
    }
    return $config;
}
```

### Structure Fichier Config

```
tenants/{tenant_id}/config/module_{module}.json
```

### Exemple de Contenu

```json
{
    "enabled_features": ["feature1", "feature2"],
    "settings": {
        "max_items": 100,
        "default_view": "list"
    },
    "api_key": "eyJpdiI6...",  // Chiffré
    "created_at": "2026-01-28T10:00:00Z"
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Module-Lifecycle]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
Aucune erreur rencontrée durant l'implémentation.

### Completion Notes List
✅ **Story 3-2 complétée** (2026-01-28)
- Ajouté méthodes de gestion de configuration : generateModuleConfig(), updateModuleConfig(), readModuleConfig(), deleteModuleConfig()
- Implémenté chiffrement/déchiffrement automatique des données sensibles (api_key, secret, password, token)
- Fichiers de configuration stockés au format JSON sur S3 : `tenants/{tenant_id}/config/module_{module}.json`
- Utilisation de Laravel Crypt::encryptString() pour sécuriser les données sensibles
- Gestion d'erreurs avec StorageException pour création et suppression
- Tous les critères d'acceptation satisfaits (#1, #2, #3)

### File List
- Modules/Superadmin/Services/TenantStorageManagerInterface.php (modifié - ajout signatures méthodes config)
- Modules/Superadmin/Services/TenantStorageManager.php (modifié - ajout implémentation config + chiffrement)

## Change Log
- 2026-01-28: Ajout fonctionnalités de génération et gestion de fichiers de configuration chiffrés sur S3

