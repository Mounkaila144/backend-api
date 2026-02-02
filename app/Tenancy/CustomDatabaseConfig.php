<?php

namespace App\Tenancy;

use PDO;
use Stancl\Tenancy\DatabaseConfig;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Contracts\TenantDatabaseManager;
use Stancl\Tenancy\Exceptions\DatabaseManagerNotRegisteredException;

/**
 * Custom DatabaseConfig for tenants using the t_sites table schema
 * with site_db_* columns instead of tenancy_db_* columns.
 */
class CustomDatabaseConfig extends DatabaseConfig
{
    public function __construct(TenantWithDatabase $tenant)
    {
        parent::__construct($tenant);
    }

    /**
     * Get database name.
     */
    public function getName(): ?string
    {
        return $this->tenant->site_db_name;
    }

    /**
     * Get database username.
     */
    public function getUsername(): ?string
    {
        return $this->tenant->site_db_login;
    }

    /**
     * Get database password.
     */
    public function getPassword(): ?string
    {
        return $this->tenant->site_db_password;
    }

    /**
     * Get template connection name.
     */
    public function getTemplateConnectionName(): string
    {
        return config('tenancy.database.template_tenant_connection')
            ?? config('tenancy.database.central_connection');
    }

    /**
     * Get the full database connection configuration.
     */
    public function connection(): array
    {
        $config = [
            'driver' => 'mysql',
            'host' => $this->tenant->site_db_host,
            'port' => $this->tenant->site_db_port ?? 3306,
            'database' => $this->tenant->site_db_name,
            'username' => $this->tenant->site_db_login,
            'password' => $this->tenant->site_db_password,
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
            'engine' => null,
        ];

        // Base PDO options for performance
        $options = [
            PDO::ATTR_TIMEOUT => 30,
            PDO::ATTR_PERSISTENT => true, // Connexion persistante pour réduire l'overhead
            PDO::ATTR_EMULATE_PREPARES => true, // Meilleure performance pour requêtes simples
        ];

        // SSL configuration if enabled
        if ($this->tenant->site_db_ssl_enabled === 'YES') {
            $sslMode = $this->tenant->site_db_ssl_mode ?? 'REQUIRED';

            // Prepare SSL CA file path
            $caFilePath = null;
            if (!empty($this->tenant->site_db_ssl_ca)) {
                if (file_exists($this->tenant->site_db_ssl_ca)) {
                    $caFilePath = $this->tenant->site_db_ssl_ca;
                } else {
                    // CA content - save to temp file
                    $tempCaFile = storage_path('app/ssl/tenant_' . $this->tenant->site_id . '_ca.pem');
                    $sslDir = dirname($tempCaFile);
                    if (!is_dir($sslDir)) {
                        mkdir($sslDir, 0755, true);
                    }
                    file_put_contents($tempCaFile, $this->tenant->site_db_ssl_ca);
                    $caFilePath = $tempCaFile;
                }
            }

            // SSL verification
            if (in_array($sslMode, ['VERIFY_CA', 'VERIFY_IDENTITY'])) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
            } else {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            // CA certificate
            if ($caFilePath) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = $caFilePath;
            }
        }

        $config['options'] = $options;

        return $config;
    }

    /**
     * Get the TenantDatabaseManager for this tenant's connection.
     */
    public function manager(): TenantDatabaseManager
    {
        $driver = 'mysql';
        $databaseManagers = config('tenancy.database.managers');

        if (!array_key_exists($driver, $databaseManagers)) {
            throw new DatabaseManagerNotRegisteredException($driver);
        }

        /** @var TenantDatabaseManager $databaseManager */
        $databaseManager = app($databaseManagers[$driver]);
        $databaseManager->setConnection($this->getTemplateConnectionName());

        return $databaseManager;
    }

    /**
     * Generate credentials (not used for existing databases).
     */
    public function makeCredentials(): void
    {
        // Not needed - we use existing databases
    }
}
