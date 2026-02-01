<?php

namespace Modules\User\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Modules\User\Repositories\UserRepository;
use Modules\User\Http\Resources\UserResource;

/**
 * User Controller (TENANT DATABASE)
 * Manages user operations for admin application
 */
class UserController extends Controller
{
    protected $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Display a paginated listing of users with filters
     * GET /api/admin/users
     * Middleware: ['auth:sanctum', 'tenant']
     *
     * This endpoint replicates the functionality of the legacy
     * ajaxListPartialAction from Symfony 1
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $timings = [];
        $totalStart = microtime(true);

        // Parse filter parameters
        $start = microtime(true);
        $filters = $this->parseFilters($request);
        $timings['parse_filters'] = round((microtime(true) - $start) * 1000, 2);

        // Get items per page (default: 10 pour optimisation, était 100)
        $perPage = $request->get('nbitemsbypage', 10);
        if ($perPage === '*') {
            $perPage = 10000; // Large number for "all"
        }

        // Get paginated users
        $start = microtime(true);
        $users = $this->userRepository->getPaginated($filters, (int) $perPage);
        $timings['getPaginated'] = round((microtime(true) - $start) * 1000, 2);

        // Get statistics (can be disabled via query param for faster response)
        $statistics = null;
        if (!$request->boolean('skip_stats')) {
            $start = microtime(true);
            $statistics = $this->userRepository->getStatistics();
            $timings['getStatistics'] = round((microtime(true) - $start) * 1000, 2);
        }

        // Récupérer les informations sur le moteur de recherche utilisé
        $searchInfo = $this->userRepository->getLastSearchInfo();

        // Transform to resource
        $start = microtime(true);
        $data = UserResource::collection($users->items());
        $timings['userResource'] = round((microtime(true) - $start) * 1000, 2);

        $timings['total'] = round((microtime(true) - $totalStart) * 1000, 2);

        // Bootstrap timings (from index.php)
        $bootstrapTimings = [];
        if (isset($_SERVER['TIMING_AUTOLOAD_START'], $_SERVER['TIMING_AUTOLOAD_END'])) {
            $bootstrapTimings['autoload_ms'] = round(($_SERVER['TIMING_AUTOLOAD_END'] - $_SERVER['TIMING_AUTOLOAD_START']) * 1000, 2);
        }
        if (isset($_SERVER['TIMING_BOOTSTRAP_START'], $_SERVER['TIMING_BOOTSTRAP_END'])) {
            $bootstrapTimings['app_bootstrap_ms'] = round(($_SERVER['TIMING_BOOTSTRAP_END'] - $_SERVER['TIMING_BOOTSTRAP_START']) * 1000, 2);
        }
        if (defined('LARAVEL_START')) {
            $bootstrapTimings['total_since_start_ms'] = round((microtime(true) - LARAVEL_START) * 1000, 2);
            $bootstrapTimings['middleware_routing_ms'] = round((microtime(true) - LARAVEL_START) * 1000, 2) - $timings['total'] - ($bootstrapTimings['autoload_ms'] ?? 0) - ($bootstrapTimings['app_bootstrap_ms'] ?? 0);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
            'statistics' => $statistics,
            'search_info' => $searchInfo,
            'timings' => $timings, // DEBUG: à supprimer en production
            'bootstrap_timings' => $bootstrapTimings, // DEBUG: où va le temps?
            'tenancy_timings' => $_SERVER['TENANCY_TIMINGS'] ?? null, // DEBUG
            'tenant' => [
                'id' => tenancy()->tenant->site_id ?? null,
                'host' => tenancy()->tenant->site_host ?? null,
            ],
        ]);
    }

    /**
     * Store a newly created user
     * POST /api/admin/users
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Basic user information
            'username' => [
                'required',
                'string',
                'max:16',
                Rule::unique('t_users', 'username')
                    ->where('application', $request->input('application', 'admin')),
            ],
            'password' => 'required|string|min:6|max:32',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('t_users', 'email')
                    ->where('application', $request->input('application', 'admin')),
            ],
            'firstname' => 'nullable|string|max:16',
            'lastname' => 'nullable|string|max:32',
            'sex' => 'nullable|in:Mr,Ms,Mrs',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'birthday' => 'nullable|date',
            'is_active' => 'nullable|in:YES,NO',
            'application' => 'required|in:admin,frontend',

            // Foreign keys
            'callcenter_id' => 'nullable|integer|exists:t_callcenter,id',
            'company_id' => 'nullable|integer',

            // Assignments (arrays of IDs)
            'group_ids' => 'nullable|array',
            'group_ids.*' => 'integer|exists:t_groups,id',
            'function_ids' => 'nullable|array',
            'function_ids.*' => 'integer|exists:t_users_function,id',
            'profile_ids' => 'nullable|array',
            'profile_ids.*' => 'integer|exists:t_users_profile,id',
            'team_ids' => 'nullable|array',
            'team_ids.*' => 'integer|exists:t_users_team,id',
            'attribution_ids' => 'nullable|array',
            'attribution_ids.*' => 'integer|exists:t_users_attribution,id',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:t_permissions,id',
        ]);

        // Hash password
        $validated['password'] = Hash::make($validated['password']);
        $validated['last_password_gen'] = now();

        // Create user with all assignments
        $user = $this->userRepository->createWithAssignments($validated);

        // Reload user with all relations for response
        $user = $this->userRepository->findWithRelations($user->id);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => new UserResource($user),
        ], 201);
    }

    /**
     * Display the specified user
     * GET /api/admin/users/{id}
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->findWithRelations($id);

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Update the specified user
     * PUT/PATCH /api/admin/users/{id}
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            // Basic user information
            'username' => [
                'sometimes',
                'required',
                'string',
                'max:16',
                Rule::unique('t_users', 'username')
                    ->where('application', $request->input('application', 'admin'))
                    ->ignore($id),
            ],
            'password' => 'sometimes|nullable|string|min:6|max:32',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('t_users', 'email')
                    ->where('application', $request->input('application', 'admin'))
                    ->ignore($id),
            ],
            'firstname' => 'nullable|string|max:16',
            'lastname' => 'nullable|string|max:32',
            'sex' => 'nullable|in:Mr,Ms,Mrs',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'birthday' => 'nullable|date',
            'is_active' => 'nullable|in:YES,NO',
            'is_locked' => 'nullable|in:YES,NO',
            'is_secure_by_code' => 'nullable|in:YES,NO',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'application' => 'sometimes|in:admin,frontend',

            // Foreign keys
            'callcenter_id' => 'nullable|integer|exists:t_callcenter,id',
            'team_id' => 'nullable|integer|exists:t_users_team,id',
            'company_id' => 'nullable|integer',

            // Assignments (arrays of IDs)
            'group_ids' => 'nullable|array',
            'group_ids.*' => 'integer|exists:t_groups,id',
            'function_ids' => 'nullable|array',
            'function_ids.*' => 'integer|exists:t_users_function,id',
            'profile_ids' => 'nullable|array',
            'profile_ids.*' => 'integer|exists:t_users_profile,id',
            'team_ids' => 'nullable|array',
            'team_ids.*' => 'integer|exists:t_users_team,id',
            'attribution_ids' => 'nullable|array',
            'attribution_ids.*' => 'integer|exists:t_users_attribution,id',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:t_permissions,id',
        ]);

        // Hash password if provided
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
            $validated['last_password_gen'] = now();
        } else {
            unset($validated['password']);
        }

        // Update user with all assignments
        $user = $this->userRepository->updateWithAssignments($id, $validated);

        // Reload user with all relations for response
        $user = $this->userRepository->findWithRelations($user->id);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Remove the specified user (soft delete)
     * DELETE /api/admin/users/{id}
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $this->userRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Parse filter parameters from request
     *
     * @param Request $request
     * @return array
     */
    protected function parseFilters(Request $request): array
    {
        $filters = [];

        // Get filter parameter (from POST or GET)
        $filter = $request->input('filter', []);

        // Search filters
        if (!empty($filter['search'])) {
            $filters['search'] = $filter['search'];
        }

        // Equal filters
        if (!empty($filter['equal'])) {
            $filters['equal'] = $filter['equal'];
        }

        // LIKE filters
        if (!empty($filter['like'])) {
            $filters['like'] = $filter['like'];
        }

        // Order filters
        if (!empty($filter['order'])) {
            $filters['order'] = $filter['order'];
        }

        // Date range filters
        if (!empty($filter['range'])) {
            $filters['range'] = $filter['range'];
        }

        return $filters;
    }

    /**
     * Get user statistics
     * GET /api/admin/users/statistics
     *
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        $statistics = $this->userRepository->getStatistics();

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

    /**
     * Get creation options (groups, functions, profiles, teams, etc.)
     * GET /api/admin/users/creation-options
     *
     * @return JsonResponse
     */
    public function creationOptions(): JsonResponse
    {
        $options = $this->userRepository->getCreationOptions();

        return response()->json([
            'success' => true,
            'data' => $options,
        ]);
    }

    /**
     * DEBUG: Analyse les performances de la requête users
     * GET /api/admin/users/debug-performance
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function debugPerformance(Request $request): JsonResponse
    {
        $timings = [];
        $queries = [];

        // Activer le query log
        \DB::enableQueryLog();

        $totalStart = microtime(true);

        // 1. Test connexion DB
        $start = microtime(true);
        \DB::select('SELECT 1');
        $timings['db_connection'] = round((microtime(true) - $start) * 1000, 2) . 'ms';

        // 2. Test requête users simple (sans relations)
        $start = microtime(true);
        $count = \DB::table('t_users')
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%')
            ->count();
        $timings['simple_count'] = round((microtime(true) - $start) * 1000, 2) . 'ms';
        $timings['user_count'] = $count;

        // 3. Test requête users avec LIMIT
        $start = microtime(true);
        $users = \DB::table('t_users')
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%')
            ->limit(10)
            ->get();
        $timings['simple_select_10'] = round((microtime(true) - $start) * 1000, 2) . 'ms';

        // 4. Test Eloquent avec relations
        $start = microtime(true);
        $usersEloquent = \Modules\User\Entities\User::query()
            ->with(['groups:id,name', 'creator:id,username,firstname,lastname', 'callcenter:id,name'])
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%')
            ->limit(10)
            ->get();
        $timings['eloquent_with_relations_10'] = round((microtime(true) - $start) * 1000, 2) . 'ms';

        // 5. Test chargement groupes batch
        $userIds = $usersEloquent->pluck('id')->toArray();
        $start = microtime(true);
        $groupsData = \DB::table('t_user_group')
            ->join('t_groups', 't_user_group.group_id', '=', 't_groups.id')
            ->whereIn('t_user_group.user_id', $userIds)
            ->select('t_user_group.user_id', 't_groups.name')
            ->get();
        $timings['groups_batch_query'] = round((microtime(true) - $start) * 1000, 2) . 'ms';

        // 6. Test statistiques optimisées
        $start = microtime(true);
        $stats = \DB::table('t_users')
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%')
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN is_active = "YES" THEN 1 ELSE 0 END) as active
            ')
            ->first();
        $timings['statistics_optimized'] = round((microtime(true) - $start) * 1000, 2) . 'ms';

        // 7. Test getPaginated complet
        $start = microtime(true);
        $filters = $this->parseFilters($request);
        $paginatedUsers = $this->userRepository->getPaginated($filters, 10);
        $timings['getPaginated_full'] = round((microtime(true) - $start) * 1000, 2) . 'ms';

        // 8. Test UserResource transformation
        $start = microtime(true);
        $resourceData = \Modules\User\Http\Resources\UserResource::collection($paginatedUsers->items());
        $json = $resourceData->toArray($request);
        $timings['userresource_transform'] = round((microtime(true) - $start) * 1000, 2) . 'ms';

        $timings['total'] = round((microtime(true) - $totalStart) * 1000, 2) . 'ms';

        // Récupérer les queries
        $queryLog = \DB::getQueryLog();
        $queries = [
            'count' => count($queryLog),
            'total_time_ms' => round(collect($queryLog)->sum('time'), 2),
            'slowest' => collect($queryLog)->sortByDesc('time')->take(5)->map(fn($q) => [
                'sql' => \Str::limit($q['query'], 100),
                'time' => $q['time'] . 'ms',
            ])->values()->toArray(),
        ];

        return response()->json([
            'success' => true,
            'timings' => $timings,
            'queries' => $queries,
            'search_info' => $this->userRepository->getLastSearchInfo(),
            'cache_info' => $this->userRepository->getServicesDiagnostics(),
        ]);
    }
}
