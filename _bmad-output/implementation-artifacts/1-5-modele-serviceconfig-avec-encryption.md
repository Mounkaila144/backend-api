# Story 1.5: Modèle ServiceConfig avec Encryption

**Status:** review

---

## Story

As a **développeur**,
I want **un modèle Eloquent pour la table t_service_config avec chiffrement automatique des credentials**,
so that **les données sensibles sont protégées au repos**.

---

## Acceptance Criteria

1. **Given** la table t_service_config existe
   **When** je sauvegarde une configuration avec des credentials
   **Then** les champs sensibles (secret_key, password, api_key) sont automatiquement chiffrés

2. **Given** une configuration chiffrée en base
   **When** je lis la configuration via le modèle
   **Then** les champs sont automatiquement déchiffrés

3. **Given** le modèle ServiceConfig
   **When** je vérifie la configuration
   **Then** le modèle utilise la connexion `mysql` (central)

4. **Given** le modèle ServiceConfig
   **When** j'utilise les méthodes d'accès
   **Then** `getDecryptedConfig()` et `setEncryptedConfig()` sont disponibles

---

## Tasks / Subtasks

- [x] **Task 1: Créer le modèle ServiceConfig** (AC: #3)
  - [ ] Créer `Modules/Superadmin/Entities/ServiceConfig.php`
  - [ ] Configurer `$connection = 'mysql'`
  - [ ] Configurer `$table = 't_service_config'`

- [x] **Task 2: Implémenter le chiffrement automatique** (AC: #1, #2)
  - [ ] Créer la liste des champs sensibles à chiffrer
  - [ ] Implémenter le chiffrement dans un mutator ou observer
  - [ ] Implémenter le déchiffrement dans un accessor

- [x] **Task 3: Créer les méthodes d'accès** (AC: #4)
  - [ ] Créer `getDecryptedConfig(): array`
  - [ ] Créer `setEncryptedConfig(array $config): void`
  - [ ] Créer `getSensitiveFields(): array` (statique)

- [x] **Task 4: Configurer le modèle** (AC: #1-4)
  - [ ] Définir `$fillable`
  - [ ] Configurer les casts
  - [ ] Désactiver timestamps si nécessaire

---

## Dev Notes

### Champs Sensibles à Chiffrer

```php
protected static array $sensitiveFields = [
    'aws_secret_key',
    'secret_key',
    'password',
    'api_key',
    'master_key',
];
```

### Emplacement

`Modules/Superadmin/Entities/ServiceConfig.php`

### Code de Référence

```php
<?php

namespace Modules\Superadmin\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ServiceConfig extends Model
{
    protected $connection = 'mysql';
    protected $table = 't_service_config';
    public $timestamps = false;

    protected $fillable = [
        'service_name',
        'config',
        'updated_at',
        'updated_by',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
    ];

    /**
     * Champs sensibles qui doivent être chiffrés
     */
    protected static array $sensitiveFields = [
        'aws_secret_key',
        'secret_key',
        'password',
        'api_key',
        'master_key',
    ];

    /**
     * Retourne la liste des champs sensibles
     */
    public static function getSensitiveFields(): array
    {
        return static::$sensitiveFields;
    }

    /**
     * Récupère la config avec les champs sensibles déchiffrés
     */
    public function getDecryptedConfig(): array
    {
        $config = json_decode($this->attributes['config'] ?? '{}', true);

        foreach (static::$sensitiveFields as $field) {
            if (isset($config[$field]) && !empty($config[$field])) {
                try {
                    $config[$field] = Crypt::decryptString($config[$field]);
                } catch (\Exception $e) {
                    // Valeur non chiffrée ou erreur - garder telle quelle
                }
            }
        }

        return $config;
    }

    /**
     * Sauvegarde la config en chiffrant les champs sensibles
     */
    public function setEncryptedConfig(array $config): void
    {
        foreach (static::$sensitiveFields as $field) {
            if (isset($config[$field]) && !empty($config[$field])) {
                $config[$field] = Crypt::encryptString($config[$field]);
            }
        }

        $this->attributes['config'] = json_encode($config);
    }

    /**
     * Accessor pour config - retourne déchiffré
     */
    public function getConfigAttribute($value): array
    {
        return $this->getDecryptedConfig();
    }

    /**
     * Mutator pour config - chiffre avant sauvegarde
     */
    public function setConfigAttribute(array $value): void
    {
        $this->setEncryptedConfig($value);
    }

    /**
     * Récupère la config pour affichage (masque les secrets)
     */
    public function getConfigForDisplay(): array
    {
        $config = $this->getDecryptedConfig();

        foreach (static::$sensitiveFields as $field) {
            if (isset($config[$field])) {
                $config[$field] = '********';
            }
        }

        return $config;
    }
}
```

### Utilisation du Chiffrement Laravel

```php
use Illuminate\Support\Facades\Crypt;

// Chiffrement
$encrypted = Crypt::encryptString($secretKey);

// Déchiffrement
$decrypted = Crypt::decryptString($encrypted);
```

Le chiffrement utilise la clé `APP_KEY` de l'environnement. AES-256-CBC par défaut.

### Anti-Patterns

```php
// ❌ MAUVAIS: Ne jamais logger les secrets
Log::info('Config updated', ['config' => $config]);

// ✅ BON: Logger sans les secrets
Log::info('Config updated', ['service' => $serviceName]);
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.5]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- ✅ Modèle ServiceConfig créé avec chiffrement automatique
- ✅ Champs sensibles définis: aws_secret_key, secret_key, password, api_key, master_key
- ✅ Méthodes: getDecryptedConfig(), setEncryptedConfig(), getConfigForDisplay()
- ✅ Accessors/Mutators pour chiffrement/déchiffrement automatique
- ✅ Utilise Laravel Crypt (AES-256-CBC)
- ✅ Protection anti-erreur pour valeurs non chiffrées
- ✅ Modèle testé avec succès (query count fonctionne)

### File List

**Nouveaux fichiers créés:**
- Modules/Superadmin/Entities/ServiceConfig.php

### Change Log

- 2026-01-28: Story 1.5 implémentée - Modèle ServiceConfig avec encryption créé

