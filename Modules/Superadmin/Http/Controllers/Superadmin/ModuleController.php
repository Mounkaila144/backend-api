<?php

namespace Modules\Superadmin\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Modules\Superadmin\Services\ModuleDiscoveryInterface;
use Modules\Superadmin\Services\ModuleDependencyResolverInterface;
use Modules\Superadmin\Services\ModuleInstallerInterface;
use Modules\Superadmin\Services\ImpactAnalyzer;
use Modules\Superadmin\Http\Resources\ModuleResource;
use Modules\Superadmin\Http\Resources\TenantModuleResource;
use Modules\Superadmin\Http\Resources\ActivationReportResource;
use Modules\Superadmin\Http\Requests\FilterModulesRequest;
use Modules\Superadmin\Http\Requests\ActivateModuleRequest;
use Modules\Superadmin\Http\Requests\ActivateBatchModulesRequest;
use Modules\Superadmin\Exceptions\ModuleActivationException;
use Modules\Superadmin\Exceptions\ModuleDeactivationException;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Tenant;

class ModuleController extends Controller
{
    public function __construct(
        private ModuleDiscoveryInterface $moduleDiscovery,
        private ModuleDependencyResolverInterface $dependencyResolver,
        private ModuleInstallerInterface $moduleInstaller,
        private ImpactAnalyzer $impactAnalyzer
    ) {}

    /**
     * Liste tous les modules disponibles
     * GET /api/superadmin/modules
     */
    public function index(FilterModulesRequest $request): AnonymousResourceCollection
    {
        $modules = $this->moduleDiscovery->getAvailableModules();

        $modules = $this->moduleDiscovery->filterBySearch($modules, $request->search);
        $modules = $this->moduleDiscovery->filterByCategory($modules, $request->category);

        return ModuleResource::collection($modules);
    }

    /**
     * Liste les modules pour un tenant spécifique
     * GET /api/superadmin/sites/{id}/modules
     */
    public function tenantModules(int $id, FilterModulesRequest $request): AnonymousResourceCollection
    {
        // Vérifier que le site existe
        $site = Tenant::findOrFail($id);

        $modules = $this->moduleDiscovery->getAvailableModulesWithStatus($id);

        $modules = $this->moduleDiscovery->filterBySearch($modules, $request->search);
        $modules = $this->moduleDiscovery->filterByCategory($modules, $request->category);
        $modules = $this->moduleDiscovery->filterByStatus($modules, $request->status);

        return TenantModuleResource::collection($modules);
    }

    /**
     * Retourne le graphe des dépendances entre modules
     * GET /api/superadmin/modules/dependencies
     */
    public function dependencies(): JsonResponse
    {
        $modules = $this->moduleDiscovery->getAvailableModules();
        $graph = [];

        foreach ($modules as $module) {
            $graph[] = [
                'name' => $module['name'],
                'dependencies' => $module['dependencies'] ?? [],
                'dependents' => $this->dependencyResolver->getDependents($module['name']),
            ];
        }

        return response()->json(['data' => $graph]);
    }

    /**
     * Retourne le graphe de dépendances d'un module spécifique
     * GET /api/superadmin/modules/{module}/dependencies/graph
     */
    public function dependencyGraph(string $module): JsonResponse
    {
        try {
            // Récupérer les dépendances et dépendants du module
            $dependencies = $this->dependencyResolver->getModuleDependencies($module);
            $dependents = $this->dependencyResolver->getDependents($module);

            // Construire les nodes pour react-flow
            $nodes = [];
            $edges = [];
            $nodeIds = [$module]; // Commencer avec le module central

            // Node central
            $nodes[] = [
                'id' => $module,
                'label' => $module,
                'type' => 'module',
                'status' => 'active', // TODO: vérifier le statut réel
                'required' => false,
            ];

            // Nodes pour les dépendances (ce dont dépend le module)
            foreach ($dependencies as $dep) {
                if (!in_array($dep, $nodeIds)) {
                    $nodes[] = [
                        'id' => $dep,
                        'label' => $dep,
                        'type' => 'module',
                        'status' => 'active',
                        'required' => true,
                    ];
                    $nodeIds[] = $dep;
                }

                // Edge: dep → module (le module dépend de dep)
                $edges[] = [
                    'from' => $dep,
                    'to' => $module,
                    'required' => true,
                ];
            }

            // Nodes pour les dépendants (modules qui dépendent de celui-ci)
            foreach ($dependents as $dependent) {
                if (!in_array($dependent, $nodeIds)) {
                    $nodes[] = [
                        'id' => $dependent,
                        'label' => $dependent,
                        'type' => 'module',
                        'status' => 'active',
                        'required' => false,
                    ];
                    $nodeIds[] = $dependent;
                }

                // Edge: module → dependent (dependent dépend du module)
                $edges[] = [
                    'from' => $module,
                    'to' => $dependent,
                    'required' => true,
                ];
            }

            return response()->json([
                'data' => [
                    'nodes' => $nodes,
                    'edges' => $edges,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate dependency graph',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retourne les modules dépendant d'un module donné
     * GET /api/superadmin/modules/{module}/dependents
     * Query params optionnels: ?site_id=X
     */
    public function dependents(Request $request, string $module): JsonResponse
    {
        $dependents = $this->dependencyResolver->getDependents($module);
        $siteId = $request->query('site_id');

        $result = collect($dependents)->map(function ($dep) use ($siteId) {
            $data = ['name' => $dep];

            if ($siteId) {
                $data['isActiveForTenant'] = $this->moduleDiscovery->isModuleActiveForTenant((int) $siteId, $dep);
            }

            return $data;
        });

        return response()->json([
            'data' => [
                'module' => $module,
                'dependents' => $result,
                'count' => $result->count(),
            ],
        ]);
    }

    /**
     * Résout les dépendances d'un ou plusieurs modules
     * POST /api/superadmin/modules/resolve-dependencies
     * Body: { "modules": ["ModuleName1", "ModuleName2"] }
     */
    public function resolveDependencies(Request $request): JsonResponse
    {
        $request->validate([
            'modules' => 'required|array|min:1',
            'modules.*' => 'required|string',
        ]);

        $modules = $request->input('modules');
        $allRequiredModules = [];
        $installOrder = [];
        $missingDependencies = [];

        try {
            // Pour chaque module demandé, résoudre ses dépendances
            foreach ($modules as $moduleName) {
                $resolved = $this->dependencyResolver->resolve($moduleName);
                $allRequiredModules = array_unique(array_merge($allRequiredModules, $resolved));
            }

            // L'ordre d'installation est déjà topologique depuis le resolver
            $installOrder = $allRequiredModules;

            return response()->json([
                'data' => [
                    'canInstall' => count($missingDependencies) === 0,
                    'requiredModules' => array_values(array_diff($allRequiredModules, $modules)),
                    'missingDependencies' => $missingDependencies,
                    'installOrder' => $installOrder,
                    'totalModules' => count($installOrder),
                ],
            ]);

        } catch (\Modules\Superadmin\Exceptions\ModuleDependencyException $e) {
            return response()->json([
                'data' => [
                    'canInstall' => false,
                    'requiredModules' => [],
                    'missingDependencies' => [$e->getMessage()],
                    'installOrder' => [],
                    'totalModules' => 0,
                ],
            ], 422);
        }
    }

    /**
     * Active un module pour un tenant
     * POST /api/superadmin/sites/{id}/modules/{module}
     */
    public function activate(ActivateModuleRequest $request, int $id, string $module): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);
        $config = $request->input('config', []);

        try {
            $activation = $this->moduleInstaller->activate($tenant, $module, $config);
            $siteModule = $activation['siteModule'];
            $result = $activation['result'];

            // Construire le rapport détaillé
            $report = [
                'module_name' => $siteModule->module_name,
                'tenant_id' => $siteModule->site_id,
                'success' => $result->success,
                'completed_steps' => $result->completedSteps,
                'duration_ms' => $result->durationMs,
                'step_details' => $result->stepDetails,
                'migrations_count' => $result->stepDetails[0]['result']['count'] ?? 0,
                'files_created' => $this->getCreatedFiles($tenant->site_id, $module),
                'config_generated' => true,
                'installed_at' => $siteModule->installed_at?->toIso8601String(),
            ];

            return response()->json([
                'message' => 'Module activated successfully',
                'data' => new ActivationReportResource($report),
            ], 201);

        } catch (ModuleActivationException $e) {
            $status = match (true) {
                str_contains($e->getMessage(), 'requires') => 422,
                str_contains($e->getMessage(), 'already active') => 409,
                default => 500,
            };

            return response()->json([
                'message' => 'Module activation failed',
                'error' => [
                    'code' => 'ACTIVATION_FAILED',
                    'detail' => $e->getMessage(),
                    'context' => $e->context(),
                ],
            ], $status);
        }
    }

    /**
     * Helper pour lister les fichiers créés
     */
    private function getCreatedFiles(int $tenantId, string $moduleName): array
    {
        return [
            "tenants/{$tenantId}/modules/{$moduleName}/uploads/",
            "tenants/{$tenantId}/modules/{$moduleName}/templates/",
            "tenants/{$tenantId}/modules/{$moduleName}/exports/",
            "tenants/{$tenantId}/modules/{$moduleName}/temp/",
            "tenants/{$tenantId}/config/module_{$moduleName}.json",
        ];
    }

    /**
     * Active plusieurs modules en batch pour un tenant
     * POST /api/superadmin/sites/{id}/modules/batch
     */
    public function activateBatch(ActivateBatchModulesRequest $request, int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);
        $modules = $request->input('modules');
        $configs = $request->input('configs', []);

        try {
            $result = $this->moduleInstaller->activateBatch($tenant, $modules, $configs);

            return response()->json([
                'message' => 'Batch activation completed',
                'data' => $result->toArray(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Batch activation failed',
                'error' => [
                    'code' => 'BATCH_ACTIVATION_FAILED',
                    'detail' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Analyse l'impact de la désactivation d'un module
     * GET /api/superadmin/sites/{id}/modules/{module}/impact
     */
    public function deactivationImpact(int $id, string $module): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        try {
            $impact = $this->impactAnalyzer->analyzeDeactivationImpact($tenant, $module);

            return response()->json([
                'data' => $impact->toArray(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Désactive un module pour un tenant
     * DELETE /api/superadmin/sites/{id}/modules/{module}
     */
    public function deactivate(Request $request, int $id, string $module): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $options = [
            'backup' => $request->boolean('backup', false),
            'force' => $request->boolean('force', false),
        ];

        try {
            $siteModule = $this->moduleInstaller->deactivate($tenant, $module, $options);

            return response()->json([
                'message' => 'Module deactivated successfully',
                'data' => [
                    'module' => $module,
                    'tenant_id' => $tenant->site_id,
                    'deactivated_at' => $siteModule->uninstalled_at?->toIso8601String(),
                    'backup_created' => $options['backup'],
                ],
            ]);

        } catch (ModuleDeactivationException $e) {
            $status = match (true) {
                !empty($e->blockingModules) => 409,
                str_contains($e->getMessage(), 'not active') => 404,
                default => 500,
            };

            return response()->json([
                'message' => 'Module deactivation failed',
                'error' => [
                    'code' => 'DEACTIVATION_FAILED',
                    'detail' => $e->getMessage(),
                    'context' => $e->context(),
                ],
            ], $status);
        }
    }

    /**
     * Désactive plusieurs modules pour un tenant
     * DELETE /api/superadmin/sites/{id}/modules/batch
     */
    public function deactivateBatch(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $request->validate([
            'modules' => ['required', 'array', 'min:1'],
            'modules.*' => ['required', 'string'],
            'backup' => ['nullable', 'boolean'],
        ]);

        $modules = $request->input('modules');
        $options = [
            'backup' => $request->boolean('backup', false),
        ];

        $result = $this->moduleInstaller->deactivateBatch($tenant, $modules, $options);

        return response()->json([
            'message' => 'Batch deactivation completed',
            'data' => array_merge($result->toArray(), [
                'summary' => [
                    'total' => count($modules),
                    'success_count' => count($result->toArray()['success']),
                    'failed_count' => count($result->toArray()['failed']),
                    'skipped_count' => count($result->toArray()['skipped']),
                ],
            ]),
        ]);
    }
}
