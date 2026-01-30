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
            'optional' => ['password', 'database', 'prefix', 'ssl', 'tls'],
        ],
        'redis-queue' => [
            'required' => ['host', 'port'],
            'optional' => ['password', 'database', 'queue_name', 'ssl', 'tls'],
        ],
        'resend' => [
            'required' => ['from_address', 'from_name'],
            'optional' => ['api_key', 'reply_to', 'test_email'],
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

        // Récupérer la configuration existante
        $existingConfig = $this->get($serviceName) ?? [];

        // Fusionner avec la nouvelle config, en préservant les champs sensibles non fournis
        $sensitiveFields = ServiceConfig::getSensitiveFields();
        foreach ($sensitiveFields as $field) {
            // Si le champ sensible n'est pas fourni ou est vide, conserver l'ancienne valeur
            if ((!isset($config[$field]) || empty($config[$field])) && isset($existingConfig[$field])) {
                $config[$field] = $existingConfig[$field];
            }
        }

        // Fusionner avec les valeurs existantes pour ne pas perdre les autres champs
        $mergedConfig = array_merge($existingConfig, $config);

        $serviceConfig = ServiceConfig::updateOrCreate(
            ['service_name' => $serviceName],
            [
                'config' => $mergedConfig,
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
