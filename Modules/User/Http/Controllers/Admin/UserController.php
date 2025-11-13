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
        // Permissions are checked by middleware in routes (credential middleware)
        // No need to check here unless specific business logic is required

        // Parse filter parameters
        $filters = $this->parseFilters($request);

        // Get items per page (default: 100)
        $perPage = $request->get('nbitemsbypage', 100);
        if ($perPage === '*') {
            $perPage = 10000; // Large number for "all"
        }

        // Get paginated users
        $users = $this->userRepository->getPaginated($filters, (int) $perPage);

        // Get statistics
        $statistics = $this->userRepository->getStatistics();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
            'statistics' => $statistics,
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
            'sex' => 'nullable|in:MR,MS,MRS',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'birthday' => 'nullable|date',
            'is_active' => 'nullable|in:YES,NO',
            'application' => 'required|in:admin,frontend',
        ]);

        // Hash password
        $validated['password'] = Hash::make($validated['password']);
        $validated['last_password_gen'] = now();

        $user = $this->userRepository->create($validated);

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
            'sex' => 'nullable|in:MR,MS,MRS',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'birthday' => 'nullable|date',
            'is_active' => 'nullable|in:YES,NO',
            'is_locked' => 'nullable|in:YES,NO',
            'is_secure_by_code' => 'nullable|in:YES,NO',
            'status' => 'nullable|in:ACTIVE,DELETE',
        ]);

        // Hash password if provided
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
            $validated['last_password_gen'] = now();
        } else {
            unset($validated['password']);
        }

        $user = $this->userRepository->update($id, $validated);

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
}
