<?php

namespace App\Models;

use App\Tenancy\CustomDatabaseConfig;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDomains;

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
        'site_last_connection',
    ];

    /**
     * Cast des types
     */
    protected $casts = [
        'site_last_connection' => 'datetime',
        'price' => 'decimal:2',
        'site_db_size' => 'integer',
        'site_size' => 'integer',
        'site_db_port' => 'integer',
    ];

    /**
     * Configuration dynamique de la base de données tenant
     */
    public function database(): \Stancl\Tenancy\DatabaseConfig
    {
        return new CustomDatabaseConfig($this);
    }

    /**
     * Stancl Tenancy uses this to resolve tenants in artisan commands (--tenants flag).
     * Must match our primary key column.
     */
    public function getTenantKeyName(): string
    {
        return 'site_id';
    }

    public function getTenantKey()
    {
        return $this->getAttribute($this->getTenantKeyName());
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
