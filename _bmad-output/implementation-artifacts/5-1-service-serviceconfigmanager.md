# Story 5.1: Service ServiceConfigManager

**Status:** review

---

## Story

As a **développeur**,
I want **un service pour gérer les configurations des services externes**,
so that **la gestion des credentials est centralisée et sécurisée**.

---

## Acceptance Criteria

1. **Given** le service ServiceConfigManager
   **When** j'appelle `get($serviceName)`
   **Then** je reçois la configuration déchiffrée du service

2. **Given** une configuration à sauvegarder
   **When** j'appelle `save($serviceName, $config)`
   **Then** les credentials sont chiffrés et sauvegardés

3. **Given** les services configurables
   **When** j'appelle `getAvailableServices()`
   **Then** je reçois la liste des services supportés

---

## Tasks / Subtasks

- [x] **Task 1: Créer ServiceConfigManager** (AC: #1, #2)
  - [x] Créer `Modules/Superadmin/Services/ServiceConfigManager.php`
  - [x] Utiliser le modèle `ServiceConfig`
  - [x] Gérer le chiffrement automatique

- [x] **Task 2: Définir les services supportés** (AC: #3)
  - [x] s3, database, redis-cache, redis-queue, ses, meilisearch
  - [x] Définir les schémas de config attendus

- [x] **Task 3: Implémenter la validation** (AC: #2)
  - [x] Valider les champs requis par service
  - [x] Lever des exceptions pour configs invalides

---

## Dev Notes

### ServiceConfigManager

```php
<?php

namespace Modules\Superadmin\Services;

use Modules\Superadmin\Entities\ServiceConfig;
use Modules\Superadmin\Events\ServiceConfigUpdated;
use Modules\Superadmin\Exceptions\ServiceConfigException;

class ServiceConfigManager
{
    /**
     * Services supportés avec leurs champs requis
     */
    protected array $serviceSchemas = [
        's3' => [
            'required' => ['access_key', 'secret_key', 'bucket', 'region'],
            'optional' => ['endpoint', 'use_path_style'],
        ],
        'database' => [
            'required' => ['host', 'port', 'username', 'password', 'database_prefix'],
            'optional' => ['charset', 'collation'],
        ],
        'redis-cache' => [
            'required' => ['host', 'port'],
            'optional' => ['password', 'database', 'prefix'],
        ],
        'redis-queue' => [
            'required' => ['host', 'port'],
            'optional' => ['password', 'database', 'queue_name'],
        ],
        'ses' => [
            'required' => ['access_key', 'secret_key', 'region'],
            'optional' => ['from_address', 'from_name'],
        ],
        'meilisearch' => [
            'required' => ['url', 'api_key'],
            'optional' => ['index_prefix'],
        ],
    ];

    /**
     * Récupère la configuration d'un service
     */
    public function get(string $serviceName): ?array
    {
        $this->validateServiceName($serviceName);

        $config = ServiceConfig::where('service_name', $serviceName)->first();

        return $config?->config;
    }

    /**
     * Sauvegarde la configuration d'un service
     */
    public function save(string $serviceName, array $config): ServiceConfig
    {
        $this->validateServiceName($serviceName);
        $this->validateConfig($serviceName, $config);

        $serviceConfig = ServiceConfig::updateOrCreate(
            ['service_name' => $serviceName],
            [
                'config' => $config,
                'updated_at' => now(),
                'updated_by' => auth()->id(),
            ]
        );

        ServiceConfigUpdated::dispatch($serviceConfig, auth()->id() ?? 0, array_keys($config));

        return $serviceConfig;
    }

    /**
     * Supprime la configuration d'un service
     */
    public function delete(string $serviceName): void
    {
        $this->validateServiceName($serviceName);

        ServiceConfig::where('service_name', $serviceName)->delete();
    }

    /**
     * Retourne la liste des services supportés
     */
    public function getAvailableServices(): array
    {
        return array_keys($this->serviceSchemas);
    }

    /**
     * Retourne le schéma d'un service
     */
    public function getServiceSchema(string $serviceName): array
    {
        $this->validateServiceName($serviceName);

        return $this->serviceSchemas[$serviceName];
    }

    /**
     * Valide le nom du service
     */
    protected function validateServiceName(string $serviceName): void
    {
        if (!isset($this->serviceSchemas[$serviceName])) {
            throw ServiceConfigException::unknownService($serviceName, $this->getAvailableServices());
        }
    }

    /**
     * Valide la configuration selon le schéma
     */
    protected function validateConfig(string $serviceName, array $config): void
    {
        $schema = $this->serviceSchemas[$serviceName];
        $missing = [];

        foreach ($schema['required'] as $field) {
            if (!isset($config[$field]) || empty($config[$field])) {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            throw ServiceConfigException::missingFields($serviceName, $missing);
        }
    }

    /**
     * Récupère la configuration pour affichage (masque les secrets)
     */
    public function getForDisplay(string $serviceName): ?array
    {
        $config = $this->get($serviceName);

        if (!$config) {
            return null;
        }

        $sensitiveFields = ServiceConfig::getSensitiveFields();

        foreach ($sensitiveFields as $field) {
            if (isset($config[$field])) {
                $config[$field] = '********';
            }
        }

        return $config;
    }
}
```

### ServiceConfigException

```php
<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class ServiceConfigException extends Exception
{
    public static function unknownService(string $service, array $available): self
    {
        $list = implode(', ', $available);
        return new self("Unknown service '{$service}'. Available: {$list}");
    }

    public static function missingFields(string $service, array $fields): self
    {
        $list = implode(', ', $fields);
        return new self("Missing required fields for '{$service}': {$list}");
    }

    public static function connectionFailed(string $service, string $reason): self
    {
        return new self("Connection to '{$service}' failed: {$reason}");
    }
}
```

### Services Supportés

| Service | Description |
|---------|-------------|
| `s3` | S3/Minio storage |
| `database` | Cloud SQL / MySQL central |
| `redis-cache` | Redis pour cache |
| `redis-queue` | Redis pour queues |
| `ses` | Amazon SES email |
| `meilisearch` | Meilisearch search engine |

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Configuration-Services-Externes]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé ServiceConfigManager pour gérer les configurations de services externes
- Implémenté la validation des services et de leurs configurations
- Support de 6 services: s3, database, redis-cache, redis-queue, ses, meilisearch
- Chiffrement automatique géré via le modèle ServiceConfig existant
- Événement ServiceConfigUpdated dispatché lors des mises à jour

### File List
- Modules/Superadmin/Services/ServiceConfigManager.php (new)
- Modules/Superadmin/Exceptions/ServiceConfigException.php (new)
- Modules/Superadmin/Events/ServiceConfigUpdated.php (new)

