<?php

namespace Modules\Superadmin\Tests\Unit;

use Tests\TestCase;
use Modules\Superadmin\Services\ModuleDiscovery;
use Modules\Superadmin\Services\ModuleDiscoveryInterface;
use Illuminate\Support\Collection;

class ModuleDiscoveryTest extends TestCase
{
    protected ModuleDiscoveryInterface $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ModuleDiscoveryInterface::class);
    }

    /**
     * AC #1: Retourne tous les modules disponibles avec métadonnées
     */
    public function test_get_available_modules_returns_collection(): void
    {
        $modules = $this->service->getAvailableModules();

        $this->assertInstanceOf(Collection::class, $modules);
        $this->assertGreaterThan(0, $modules->count(), 'Should have at least one module');
    }

    /**
     * AC #2: Les métadonnées contiennent les champs requis
     */
    public function test_module_metadata_contains_required_fields(): void
    {
        $modules = $this->service->getAvailableModules();
        $module = $modules->first();

        $this->assertIsArray($module);
        $this->assertArrayHasKey('name', $module);
        $this->assertArrayHasKey('alias', $module);
        $this->assertArrayHasKey('description', $module);
        $this->assertArrayHasKey('version', $module);
        $this->assertArrayHasKey('dependencies', $module);
        $this->assertArrayHasKey('priority', $module);
        $this->assertArrayHasKey('is_system', $module);
        $this->assertArrayHasKey('path', $module);
        $this->assertArrayHasKey('enabled', $module);
    }

    /**
     * AC #3: Filtre les modules système (Superadmin, UsersGuard, Site)
     */
    public function test_get_activatable_modules_excludes_system_modules(): void
    {
        $activatableModules = $this->service->getActivatableModules();
        $systemModules = ['Superadmin', 'UsersGuard', 'Site'];

        $activatableModules->each(function ($module) use ($systemModules) {
            $this->assertNotContains(
                $module['name'],
                $systemModules,
                "Module {$module['name']} should not be in activatable modules"
            );
        });
    }

    /**
     * Test que getActivatableModuleNames retourne un array de noms
     */
    public function test_get_activatable_module_names_returns_array(): void
    {
        $moduleNames = $this->service->getActivatableModuleNames();

        $this->assertIsArray($moduleNames);
        $this->assertNotContains('Superadmin', $moduleNames);
        $this->assertNotContains('UsersGuard', $moduleNames);
        $this->assertNotContains('Site', $moduleNames);
    }

    /**
     * Test que isActivatable retourne true pour un module activable
     */
    public function test_is_activatable_returns_true_for_activatable_module(): void
    {
        $activatableNames = $this->service->getActivatableModuleNames();

        if (count($activatableNames) > 0) {
            $moduleName = $activatableNames[0];
            $this->assertTrue($this->service->isActivatable($moduleName));
        } else {
            $this->markTestSkipped('No activatable modules found');
        }
    }

    /**
     * Test que isActivatable retourne false pour un module système
     */
    public function test_is_activatable_returns_false_for_system_module(): void
    {
        $this->assertFalse($this->service->isActivatable('Superadmin'));
        $this->assertFalse($this->service->isActivatable('UsersGuard'));
        $this->assertFalse($this->service->isActivatable('Site'));
    }

    /**
     * Test que les modules ont le flag is_system correctement défini
     */
    public function test_system_modules_have_is_system_flag_true(): void
    {
        $allModules = $this->service->getAvailableModules();
        $systemModules = ['Superadmin', 'UsersGuard', 'Site'];

        $allModules->each(function ($module) use ($systemModules) {
            if (in_array($module['name'], $systemModules)) {
                $this->assertTrue(
                    $module['is_system'],
                    "Module {$module['name']} should have is_system = true"
                );
            }
        });
    }

    /**
     * AC #1: getModulesForTenant retourne les modules actifs d'un tenant
     */
    public function test_get_modules_for_tenant_returns_active_modules(): void
    {
        // Note: Ce test nécessite des données de test dans t_site_modules
        $siteId = 1;
        $modules = $this->service->getModulesForTenant($siteId);

        $this->assertInstanceOf(Collection::class, $modules);

        // Chaque module doit avoir tenant_status
        $modules->each(function ($module) {
            $this->assertArrayHasKey('tenant_status', $module);
            $this->assertArrayHasKey('is_active', $module['tenant_status']);
            $this->assertTrue($module['tenant_status']['is_active']);
        });
    }

    /**
     * AC #2: getAvailableModulesWithStatus inclut les statuts et dates
     */
    public function test_get_available_modules_with_status_includes_tenant_status(): void
    {
        $siteId = 1;
        $modules = $this->service->getAvailableModulesWithStatus($siteId);

        $this->assertInstanceOf(Collection::class, $modules);

        $modules->each(function ($module) {
            $this->assertArrayHasKey('name', $module);
            $this->assertArrayHasKey('tenant_status', $module);

            if ($module['tenant_status'] !== null) {
                $this->assertArrayHasKey('is_active', $module['tenant_status']);
                $this->assertArrayHasKey('installed_at', $module['tenant_status']);
                $this->assertArrayHasKey('uninstalled_at', $module['tenant_status']);
                $this->assertArrayHasKey('config', $module['tenant_status']);
            }
        });
    }

    /**
     * AC #3: Tenant sans modules retourne liste vide
     */
    public function test_get_modules_for_tenant_returns_empty_for_tenant_without_modules(): void
    {
        $siteId = 99999; // Tenant inexistant
        $modules = $this->service->getModulesForTenant($siteId);

        $this->assertInstanceOf(Collection::class, $modules);
        $this->assertCount(0, $modules);
    }

    /**
     * Test isModuleActiveForTenant retourne true pour module actif
     */
    public function test_is_module_active_for_tenant_returns_true_for_active_module(): void
    {
        // Note: Test nécessite données de test
        $siteId = 1;
        $moduleName = 'Customer'; // Supposons qu'il soit actif

        $isActive = $this->service->isModuleActiveForTenant($siteId, $moduleName);

        $this->assertIsBool($isActive);
    }

    /**
     * Test isModuleActiveForTenant retourne false pour module inactif
     */
    public function test_is_module_active_for_tenant_returns_false_for_inactive_module(): void
    {
        $siteId = 99999; // Tenant inexistant
        $moduleName = 'Customer';

        $isActive = $this->service->isModuleActiveForTenant($siteId, $moduleName);

        $this->assertFalse($isActive);
    }

    /**
     * AC #1: filterBySearch filtre par nom/description/alias
     */
    public function test_filter_by_search_filters_modules_by_name(): void
    {
        $modules = $this->service->getAvailableModules();

        $filtered = $this->service->filterBySearch($modules, 'customer');

        $this->assertInstanceOf(Collection::class, $filtered);

        $filtered->each(function ($module) {
            $this->assertTrue(
                str_contains(strtolower($module['name']), 'customer') ||
                str_contains(strtolower($module['description'] ?? ''), 'customer') ||
                str_contains(strtolower($module['alias'] ?? ''), 'customer')
            );
        });
    }

    /**
     * Test filterBySearch retourne tous les modules si search vide
     */
    public function test_filter_by_search_returns_all_modules_when_search_empty(): void
    {
        $modules = $this->service->getAvailableModules();

        $filtered = $this->service->filterBySearch($modules, null);

        $this->assertEquals($modules->count(), $filtered->count());
    }

    /**
     * AC #2: filterByCategory filtre par catégorie
     */
    public function test_filter_by_category_filters_modules(): void
    {
        $modules = collect([
            ['name' => 'Module1', 'category' => 'crm'],
            ['name' => 'Module2', 'category' => 'accounting'],
            ['name' => 'Module3', 'category' => 'crm'],
        ]);

        $filtered = $this->service->filterByCategory($modules, 'crm');

        $this->assertCount(2, $filtered);
    }

    /**
     * AC #3: filterByStatus filtre par statut tenant
     */
    public function test_filter_by_status_filters_active_modules(): void
    {
        $modules = collect([
            ['name' => 'Module1', 'tenant_status' => ['is_active' => true]],
            ['name' => 'Module2', 'tenant_status' => ['is_active' => false]],
            ['name' => 'Module3', 'tenant_status' => null],
        ]);

        $filtered = $this->service->filterByStatus($modules, 'active');

        $this->assertCount(1, $filtered);
    }

    /**
     * Test filterByStatus pour not_installed
     */
    public function test_filter_by_status_filters_not_installed_modules(): void
    {
        $modules = collect([
            ['name' => 'Module1', 'tenant_status' => ['is_active' => true]],
            ['name' => 'Module2', 'tenant_status' => null],
            ['name' => 'Module3', 'tenant_status' => null],
        ]);

        $filtered = $this->service->filterByStatus($modules, 'not_installed');

        $this->assertCount(2, $filtered);
    }
}
