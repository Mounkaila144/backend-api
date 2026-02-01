<?php

namespace Modules\Site\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Modules\Site\Http\Resources\SiteResource;
use Modules\Site\Http\Resources\SiteCollection;
use Modules\Site\Http\Resources\SiteListResource;
use Modules\Site\Repositories\SiteRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Contrôleur Superadmin pour gérer les sites/tenants
 * Opère sur la base de données centrale
 */
class SiteController extends Controller
{
    protected SiteRepository $siteRepository;

    public function __construct(SiteRepository $siteRepository)
    {
        $this->siteRepository = $siteRepository;
    }

    /**
     * Liste tous les sites avec pagination et filtres
     * GET /api/superadmin/sites
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'search' => $request->get('search'),
            'sort_by' => $request->get('sort_by', 'site_host'),
            'sort_order' => $request->get('sort_order', 'asc'),
        ];

        // Ajouter les filtres booléens seulement s'ils sont présents dans la requête
        if ($request->has('available')) {
            $filters['available'] = $request->boolean('available');
        }
        if ($request->has('admin_available')) {
            $filters['admin_available'] = $request->boolean('admin_available');
        }
        if ($request->has('frontend_available')) {
            $filters['frontend_available'] = $request->boolean('frontend_available');
        }
        if ($request->has('is_customer')) {
            $filters['is_customer'] = $request->boolean('is_customer');
        }
        if ($request->has('type')) {
            $filters['type'] = $request->get('type');
        }

        $perPage = $request->get('per_page', 50);
        $sites = $this->siteRepository->getAllPaginated($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => SiteListResource::collection($sites->items()),
            'meta' => [
                'current_page' => $sites->currentPage(),
                'total' => $sites->total(),
                'per_page' => $sites->perPage(),
                'last_page' => $sites->lastPage(),
                'from' => $sites->firstItem(),
                'to' => $sites->lastItem(),
            ],
        ]);
    }

    /**
     * Afficher un site spécifique
     * GET /api/superadmin/sites/{id}
     */
    public function show($id): JsonResponse
    {
        $site = $this->siteRepository->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new SiteResource($site),
        ]);
    }

    /**
     * Créer un nouveau site
     * POST /api/superadmin/sites
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'site_host' => 'required|string|max:255|unique:t_sites,site_host',
            'site_db_name' => 'required|string|max:255',
            'site_db_host' => 'required|string|max:255',
            'site_db_port' => 'nullable|integer|min:1|max:65535',
            'site_db_ssl_enabled' => 'nullable|in:YES,NO',
            'site_db_ssl_mode' => 'nullable|in:DISABLED,PREFERRED,REQUIRED,VERIFY_CA,VERIFY_IDENTITY',
            'site_db_ssl_ca' => 'nullable|string',
            'site_db_login' => 'required|string|max:255',
            'site_db_password' => 'nullable|string|max:255',
            'site_admin_theme' => 'nullable|string|max:100',
            'site_admin_theme_base' => 'nullable|string|max:100',
            'site_frontend_theme' => 'nullable|string|max:100',
            'site_frontend_theme_base' => 'nullable|string|max:100',
            'site_type' => 'nullable|in:CUST,ECOM,CMS',
            'site_company' => 'nullable|string|max:255',
            'site_admin_available' => 'nullable|in:YES,NO',
            'site_frontend_available' => 'nullable|in:YES,NO',
            'site_available' => 'nullable|in:YES,NO',
            'is_customer' => 'nullable|in:YES,NO',
            'site_access_restricted' => 'nullable|in:YES,NO',
            'create_database' => 'nullable|boolean',
            'setup_tables' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $site = $this->siteRepository->create($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Site created successfully',
                'data' => new SiteResource($site),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create site: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour un site
     * PUT /api/superadmin/sites/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $site = $this->siteRepository->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'site_host' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('t_sites')->ignore($id, 'site_id'),
            ],
            'site_db_name' => 'sometimes|string|max:255',
            'site_db_host' => 'sometimes|string|max:255',
            'site_db_port' => 'nullable|integer|min:1|max:65535',
            'site_db_ssl_enabled' => 'nullable|in:YES,NO',
            'site_db_ssl_mode' => 'nullable|in:DISABLED,PREFERRED,REQUIRED,VERIFY_CA,VERIFY_IDENTITY',
            'site_db_ssl_ca' => 'nullable|string',
            'site_db_login' => 'sometimes|string|max:255',
            'site_db_password' => 'nullable|string|max:255',
            'site_admin_theme' => 'sometimes|string|max:100',
            'site_admin_theme_base' => 'sometimes|string|max:100',
            'site_frontend_theme' => 'sometimes|string|max:100',
            'site_frontend_theme_base' => 'sometimes|string|max:100',
            'site_type' => 'sometimes|in:CUST,ECOM,CMS',
            'site_company' => 'nullable|string|max:255',
            'site_admin_available' => 'sometimes|in:YES,NO',
            'site_frontend_available' => 'sometimes|in:YES,NO',
            'site_available' => 'sometimes|in:YES,NO',
            'is_customer' => 'sometimes|in:YES,NO',
            'site_access_restricted' => 'sometimes|in:YES,NO',
            'site_master' => 'nullable|string|max:255',
            'logo' => 'nullable|string|max:255',
            'picture' => 'nullable|string|max:255',
            'banner' => 'nullable|string|max:255',
            'favicon' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $site = $this->siteRepository->update($site, $validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Site updated successfully',
                'data' => new SiteResource($site),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update site: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un site
     * DELETE /api/superadmin/sites/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $site = $this->siteRepository->findOrFail($id);
        $deleteDatabase = $request->boolean('delete_database', false);

        try {
            $this->siteRepository->delete($site, $deleteDatabase);

            return response()->json([
                'success' => true,
                'message' => 'Site deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete site: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tester la connexion à la base de données d'un site
     * POST /api/superadmin/sites/{id}/test-connection
     */
    public function testConnection($id): JsonResponse
    {
        $site = $this->siteRepository->findOrFail($id);
        $result = $this->siteRepository->testConnection($site);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Connection successful',
                'data' => $result,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Connection failed: ' . $result['error'],
        ], 500);
    }

    /**
     * Obtenir les statistiques des sites
     * GET /api/superadmin/sites/statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = $this->siteRepository->getStatistics();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Mettre à jour la taille de la base de données d'un site
     * POST /api/superadmin/sites/{id}/update-size
     */
    public function updateDatabaseSize($id): JsonResponse
    {
        $site = $this->siteRepository->findOrFail($id);

        try {
            $this->siteRepository->updateDatabaseSize($site);

            // Recharger le site depuis la base de données
            $site = $this->siteRepository->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Database size updated successfully',
                'data' => new SiteResource($site),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update database size: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Activer/désactiver globalement les sites
     * POST /api/superadmin/sites/toggle-availability
     */
    public function toggleAvailability(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'site_ids' => 'required|array',
            'site_ids.*' => 'exists:t_sites,site_id',
            'available' => 'required|in:YES,NO',
            'scope' => 'required|in:site,admin,frontend',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $field = match ($validated['scope']) {
            'admin' => 'site_admin_available',
            'frontend' => 'site_frontend_available',
            default => 'site_available',
        };

        try {
            \App\Models\Tenant::whereIn('site_id', $validated['site_ids'])
                ->update([$field => $validated['available']]);

            return response()->json([
                'success' => true,
                'message' => 'Sites availability updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update availability: ' . $e->getMessage(),
            ], 500);
        }
    }
}
