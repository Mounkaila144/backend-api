<?php

namespace Modules\Superadmin\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Tenant;

class SiteModule extends Model
{
    /**
     * Connexion à la base centrale
     */
    protected $connection = 'mysql';

    /**
     * Table avec préfixe t_
     */
    protected $table = 't_site_modules';

    /**
     * Pas de timestamps Laravel (utilise installed_at/uninstalled_at)
     */
    public $timestamps = false;

    /**
     * Colonnes modifiables
     */
    protected $fillable = [
        'site_id',
        'module_name',
        'is_active',
        'installed_at',
        'uninstalled_at',
        'config',
    ];

    /**
     * Casts automatiques
     */
    protected $casts = [
        'config' => 'array',
        'installed_at' => 'datetime',
        'uninstalled_at' => 'datetime',
    ];

    /**
     * Relation vers le site (tenant)
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'site_id', 'site_id');
    }

    /**
     * Scope: modules actifs uniquement
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 'YES');
    }

    /**
     * Scope: modules inactifs uniquement
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', 'NO');
    }

    /**
     * Scope: modules d'un tenant spécifique
     */
    public function scopeForTenant($query, int $siteId)
    {
        return $query->where('site_id', $siteId);
    }

    /**
     * Helper: Vérifier si le module est actif
     */
    public function isActive(): bool
    {
        return $this->is_active === 'YES';
    }
}
