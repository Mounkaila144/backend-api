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
        'installed_version',
        'version_updated_at',
        'version_history',
    ];

    /**
     * Casts automatiques
     */
    protected $casts = [
        'config' => 'array',
        'installed_at' => 'datetime',
        'uninstalled_at' => 'datetime',
        'version_updated_at' => 'datetime',
        'version_history' => 'array',
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

    /**
     * Helper: Retourne la version installée ou null
     */
    public function getInstalledVersion(): ?string
    {
        return $this->installed_version;
    }

    /**
     * Helper: Vérifie si une version spécifique est installée
     */
    public function hasVersion(string $version): bool
    {
        return $this->installed_version !== null
            && version_compare($this->installed_version, $version, '>=');
    }

    /**
     * Helper: Met à jour la version installée et l'historique
     */
    public function updateVersion(string $newVersion, array $appliedVersions = []): void
    {
        $history = $this->version_history ?? [];

        // Ajouter l'entrée à l'historique
        $history[] = [
            'from_version' => $this->installed_version,
            'to_version' => $newVersion,
            'applied_versions' => $appliedVersions,
            'applied_at' => now()->toIso8601String(),
        ];

        $this->update([
            'installed_version' => $newVersion,
            'version_updated_at' => now(),
            'version_history' => $history,
        ]);
    }

    /**
     * Helper: Vérifie si le module nécessite une mise à jour vers une version cible
     */
    public function needsUpgrade(string $targetVersion): bool
    {
        if ($this->installed_version === null) {
            return true;
        }

        return version_compare($this->installed_version, $targetVersion, '<');
    }

    /**
     * Helper: Retourne l'historique des versions formaté
     */
    public function getVersionHistoryFormatted(): array
    {
        return array_map(function ($entry) {
            return [
                'from' => $entry['from_version'] ?? 'initial',
                'to' => $entry['to_version'],
                'date' => $entry['applied_at'] ?? null,
                'versions_count' => count($entry['applied_versions'] ?? []),
            ];
        }, $this->version_history ?? []);
    }
}
