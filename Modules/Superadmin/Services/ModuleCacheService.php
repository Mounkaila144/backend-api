<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;

class ModuleCacheService
{
    // TTL en secondes
    const TTL_AVAILABLE_MODULES = 600;     // 10 minutes
    const TTL_TENANT_MODULES = 300;        // 5 minutes
    const TTL_DEPENDENCIES = 1800;         // 30 minutes

    // Cache keys
    const KEY_AVAILABLE = 'modules:available';
    const KEY_TENANT_PREFIX = 'modules:tenant:';
    const KEY_DEPENDENCIES = 'modules:dependencies';

    /**
     * Récupère les modules disponibles du cache ou les charge
     *
     * @param callable $loader Fonction qui charge les données si cache vide
     * @return Collection
     */
    public function getAvailableModules(callable $loader): Collection
    {
        return Cache::remember(
            self::KEY_AVAILABLE,
            self::TTL_AVAILABLE_MODULES,
            $loader
        );
    }

    /**
     * Récupère les modules d'un tenant du cache ou les charge
     *
     * @param int $siteId
     * @param callable $loader Fonction qui charge les données si cache vide
     * @return Collection
     */
    public function getTenantModules(int $siteId, callable $loader): Collection
    {
        return Cache::remember(
            self::KEY_TENANT_PREFIX . $siteId,
            self::TTL_TENANT_MODULES,
            $loader
        );
    }

    /**
     * Récupère le graphe de dépendances du cache ou le charge
     *
     * @param callable $loader Fonction qui charge les données si cache vide
     * @return array
     */
    public function getDependencies(callable $loader): array
    {
        return Cache::remember(
            self::KEY_DEPENDENCIES,
            self::TTL_DEPENDENCIES,
            $loader
        );
    }

    /**
     * Invalide le cache des modules disponibles
     */
    public function forgetAvailable(): void
    {
        Cache::forget(self::KEY_AVAILABLE);
    }

    /**
     * Invalide le cache d'un tenant
     *
     * @param int $siteId
     */
    public function forgetTenant(int $siteId): void
    {
        Cache::forget(self::KEY_TENANT_PREFIX . $siteId);
    }

    /**
     * Invalide le cache des dépendances
     */
    public function forgetDependencies(): void
    {
        Cache::forget(self::KEY_DEPENDENCIES);
    }

    /**
     * Invalide tout le cache modules
     */
    public function forgetAll(): void
    {
        $this->forgetAvailable();
        $this->forgetDependencies();
        // Note: pour invalider tous les tenants, il faudrait tracker les clés
        // ou utiliser un tag Redis
    }
}
