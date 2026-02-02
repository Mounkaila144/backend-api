<?php

namespace Modules\Superadmin\Services;

use Illuminate\Support\Collection;
use Nwidart\Modules\Facades\Module;
use Modules\Superadmin\Entities\SiteModule;

class ModuleDiscovery implements ModuleDiscoveryInterface
{
    /**
     * Modules système qui ne peuvent pas être activés/désactivés par tenant
     */
    protected array $systemModules = [
        'Superadmin',
        'UsersGuard',
        'Site',
    ];

    /**
     * Create a new ModuleDiscovery instance.
     */
    public function __construct(
        private ModuleCacheService $cache
    ) {}

    /**
     * Retourne tous les modules disponibles avec métadonnées (avec cache)
     */
    public function getAvailableModules(): Collection
    {
        return $this->cache->getAvailableModules(function () {
            return collect(Module::all())->map(function ($module) {
                return $this->extractModuleMetadata($module);
            });
        });
    }

    /**
     * Retourne uniquement les modules activables par tenant
     */
    public function getActivatableModules(): Collection
    {
        return $this->getAvailableModules()
            ->filter(fn ($module) => !in_array($module['name'], $this->systemModules));
    }

    /**
     * Retourne les noms des modules activables
     */
    public function getActivatableModuleNames(): array
    {
        return $this->getActivatableModules()
            ->pluck('name')
            ->toArray();
    }

    /**
     * Vérifie si un module est activable
     */
    public function isActivatable(string $moduleName): bool
    {
        return in_array($moduleName, $this->getActivatableModuleNames());
    }

    /**
     * Extrait les métadonnées d'un module
     */
    protected function extractModuleMetadata($module): array
    {
        $json = $module->json();

        return [
            'name' => $module->getName(),
            'alias' => $json->get('alias'),
            'description' => $json->get('description', ''),
            'version' => $json->get('version', '1.0.0'),
            'dependencies' => $json->get('dependencies', []),
            'priority' => $json->get('priority', 0),
            'is_system' => in_array($module->getName(), $this->systemModules),
            'path' => $module->getPath(),
            'enabled' => $module->isEnabled(),
        ];
    }

    /**
     * Récupère les modules activés pour un tenant (avec cache)
     */
    public function getModulesForTenant(int $siteId): Collection
    {
        return $this->cache->getTenantModules($siteId, function () use ($siteId) {
            return SiteModule::forTenant($siteId)
                ->active()
                ->get()
                ->map(fn ($sm) => $this->enrichWithMetadata($sm));
        });
    }

    /**
     * Récupère tous les modules disponibles avec le statut pour ce tenant
     */
    public function getAvailableModulesWithStatus(int $siteId): Collection
    {
        $tenantModules = SiteModule::forTenant($siteId)
            ->get()
            ->keyBy('module_name');

        return $this->getActivatableModules()->map(function ($module) use ($tenantModules) {
            $tenantModule = $tenantModules->get($module['name']);

            return array_merge($module, [
                'tenant_status' => $tenantModule ? [
                    'is_active' => $tenantModule->isActive(),
                    'installed_at' => $tenantModule->installed_at?->toIso8601String(),
                    'uninstalled_at' => $tenantModule->uninstalled_at?->toIso8601String(),
                    'config' => $tenantModule->config,
                    'installed_version' => $tenantModule->installed_version,
                    'version_history' => $tenantModule->version_history,
                ] : null,
            ]);
        });
    }

    /**
     * Vérifie si un module est actif pour un tenant
     */
    public function isModuleActiveForTenant(int $siteId, string $moduleName): bool
    {
        return SiteModule::forTenant($siteId)
            ->where('module_name', $moduleName)
            ->active()
            ->exists();
    }

    /**
     * Enrichit un SiteModule avec les métadonnées du module
     */
    protected function enrichWithMetadata(SiteModule $siteModule): array
    {
        $module = Module::find($siteModule->module_name);
        $metadata = $module ? $this->extractModuleMetadata($module) : [];

        return array_merge($metadata, [
            'tenant_status' => [
                'is_active' => $siteModule->isActive(),
                'installed_at' => $siteModule->installed_at?->toIso8601String(),
                'uninstalled_at' => $siteModule->uninstalled_at?->toIso8601String(),
                'config' => $siteModule->config,
                'installed_version' => $siteModule->installed_version,
                'version_history' => $siteModule->version_history,
            ],
        ]);
    }

    /**
     * Filtre les modules par recherche textuelle
     */
    public function filterBySearch(Collection $modules, ?string $search): Collection
    {
        if (empty($search)) {
            return $modules;
        }

        $search = strtolower($search);

        return $modules->filter(function ($module) use ($search) {
            return str_contains(strtolower($module['name']), $search)
                || str_contains(strtolower($module['description'] ?? ''), $search)
                || str_contains(strtolower($module['alias'] ?? ''), $search);
        });
    }

    /**
     * Filtre les modules par catégorie
     */
    public function filterByCategory(Collection $modules, ?string $category): Collection
    {
        if (empty($category)) {
            return $modules;
        }

        return $modules->filter(fn ($module) => ($module['category'] ?? '') === $category);
    }

    /**
     * Filtre les modules par statut tenant
     */
    public function filterByStatus(Collection $modules, ?string $status): Collection
    {
        if (empty($status)) {
            return $modules;
        }

        return $modules->filter(function ($module) use ($status) {
            $tenantStatus = $module['tenant_status'] ?? null;

            return match ($status) {
                'active' => $tenantStatus && $tenantStatus['is_active'],
                'inactive' => $tenantStatus && !$tenantStatus['is_active'],
                'not_installed' => $tenantStatus === null,
                default => true,
            };
        });
    }
}
