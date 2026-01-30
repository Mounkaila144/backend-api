<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Collection;

interface ModuleDiscoveryInterface
{
    /**
     * Retourne tous les modules disponibles avec métadonnées
     */
    public function getAvailableModules(): Collection;

    /**
     * Retourne uniquement les modules activables par tenant
     */
    public function getActivatableModules(): Collection;

    /**
     * Retourne les noms des modules activables
     */
    public function getActivatableModuleNames(): array;

    /**
     * Vérifie si un module est activable
     */
    public function isActivatable(string $moduleName): bool;

    /**
     * Récupère les modules activés pour un tenant
     */
    public function getModulesForTenant(int $siteId): Collection;

    /**
     * Récupère tous les modules disponibles avec le statut pour ce tenant
     */
    public function getAvailableModulesWithStatus(int $siteId): Collection;

    /**
     * Vérifie si un module est actif pour un tenant
     */
    public function isModuleActiveForTenant(int $siteId, string $moduleName): bool;

    /**
     * Filtre les modules par recherche textuelle
     */
    public function filterBySearch(Collection $modules, ?string $search): Collection;

    /**
     * Filtre les modules par catégorie
     */
    public function filterByCategory(Collection $modules, ?string $category): Collection;

    /**
     * Filtre les modules par statut tenant
     */
    public function filterByStatus(Collection $modules, ?string $status): Collection;
}
