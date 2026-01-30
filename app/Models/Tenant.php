<?php

namespace App\Models;

use PDO;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\DatabaseConfig;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * ⚠️ IMPORTANT: Utiliser votre table existante t_sites
     */
    protected $table = 't_sites';

    /**
     * Clé primaire
     */
    protected $primaryKey = 'site_id';

    /**
     * Connexion à la base centrale
     */
    protected $connection = 'mysql';

    /**
     * Pas de timestamps Laravel (votre table n'en a peut-être pas)
     */
    public $timestamps = false;

    /**
     * Colonnes modifiables
     */
    protected $fillable = [
        'site_host',
        'site_db_name',
        'site_db_login',
        'site_db_password',
        'site_db_host',
        'site_db_port',
        'site_db_ssl_enabled',
        'site_db_ssl_mode',
        'site_db_ssl_ca',
        'site_admin_theme',
        'site_admin_theme_base',
        'site_frontend_theme',
        'site_frontend_theme_base',
        'site_available',
        'site_admin_available',
        'site_frontend_available',
        'site_type',
        'site_master',
        'site_access_restricted',
        'site_company',
        'is_customer',
        'is_uptodate',
        'logo',
        'picture',
        'banner',
        'favicon',
        'price',
        'site_db_size',
        'site_size',
        'last_connection',
    ];

    /**
     * Cast des types
     */
    protected $casts = [
        'last_connection' => 'datetime',
        'price' => 'decimal:2',
        'site_db_size' => 'integer',
        'site_size' => 'integer',
        'site_db_port' => 'integer',
    ];

    /**
     * Configuration dynamique de la base de données tenant
     */
    public function database(): DatabaseConfig
    {
        $config = [
            'driver' => 'mysql',
            'host' => $this->site_db_host,
            'port' => $this->site_db_port ?? 3306,
            'database' => $this->site_db_name,
            'username' => $this->site_db_login,
            'password' => $this->site_db_password,
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
            'engine' => null,
        ];

        // Configuration SSL si activée
        if ($this->site_db_ssl_enabled === 'YES') {
            $sslOptions = [];

            // Mode SSL
            $sslMode = $this->site_db_ssl_mode ?? 'REQUIRED';
            if ($sslMode !== 'DISABLED') {
                $sslOptions[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = in_array($sslMode, ['VERIFY_CA', 'VERIFY_IDENTITY']);
            }

            // Certificat CA
            if (!empty($this->site_db_ssl_ca)) {
                // Si c'est un chemin de fichier
                if (file_exists($this->site_db_ssl_ca)) {
                    $sslOptions[PDO::MYSQL_ATTR_SSL_CA] = $this->site_db_ssl_ca;
                } else {
                    // Si c'est le contenu du certificat, on le sauvegarde temporairement
                    $tempCaFile = storage_path('app/ssl/tenant_' . $this->site_id . '_ca.pem');
                    $sslDir = dirname($tempCaFile);
                    if (!is_dir($sslDir)) {
                        mkdir($sslDir, 0755, true);
                    }
                    file_put_contents($tempCaFile, $this->site_db_ssl_ca);
                    $sslOptions[PDO::MYSQL_ATTR_SSL_CA] = $tempCaFile;
                }
            }

            if (!empty($sslOptions)) {
                $config['options'] = $sslOptions;
            }
        }

        return DatabaseConfig::from($config);
    }

    /**
     * Méthodes helper
     */
    public function getDatabaseName(): string
    {
        return $this->site_db_name;
    }

    public function getDomain(): string
    {
        return $this->site_host;
    }

    public function isAvailable(): bool
    {
        return $this->site_available === 'YES';
    }

    /**
     * Scope pour sites disponibles uniquement
     */
    public function scopeAvailable($query)
    {
        return $query->where('site_available', 'YES');
    }
}
