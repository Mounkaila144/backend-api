<?php


namespace App\Models;

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
        'site_admin_theme',
        'site_frontend_theme',
        'site_available',
    ];

    /**
     * Configuration dynamique de la base de données tenant
     */
    public function database(): DatabaseConfig
    {
        return DatabaseConfig::from([
            'driver' => 'mysql',
            'host' => $this->site_db_host,
            'database' => $this->site_db_name,
            'username' => $this->site_db_login,
            'password' => $this->site_db_password,
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
            'engine' => null,
        ]);
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
