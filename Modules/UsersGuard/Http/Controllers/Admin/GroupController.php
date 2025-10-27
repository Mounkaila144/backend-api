    <?php

namespace Modules\UsersGuard\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\UsersGuard\Repositories\GroupRepository;
use Modules\UsersGuard\Http\Resources\GroupResource;

/**
 * Gestion des groupes ADMIN (base TENANT)
 */
class GroupController extends Controller
{
    protected $groupRepository;

    public function __construct(GroupRepository $groupRepository)
    {
        $this->groupRepository = $groupRepository;
    }

    /**
     * Display a listing of groups
     * GET /api/admin/groups
     * Middleware: ['auth:sanctum', 'tenant']
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['application', 'search', 'active']);
        $perPage = $request->get('per_page', 50);

        $groups = $this->groupRepository->getPaginated($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => GroupResource::collection($groups->items()),
            'meta' => [
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'total' => $groups->total(),
            ],
            'tenant' => [
                'id' => tenancy()->tenant->site_id,
                'host' => tenancy()->tenant->site_host,
            ],
        ]);
    }

    /**
     * Store a newly created group
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'application' => 'required|in:admin,frontend',
        ]);

        $group = $this->groupRepository->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Group created successfully',
            'data' => new GroupResource($group),
        ], 201);
    }

    /**
     * Display the specified group
     */
    public function show($id): JsonResponse
    {
        $group = $this->groupRepository->findWithRelations($id);

        return response()->json([
            'success' => true,
            'data' => new GroupResource($group),
        ]);
    }

    /**
     * Update the specified group
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'application' => 'required|in:admin,frontend',
        ]);

        $group = $this->groupRepository->update($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Group updated successfully',
            'data' => new GroupResource($group),
        ]);
    }

    /**
     * Remove the specified group
     */
    public function destroy($id): JsonResponse
    {
        $this->groupRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Group deleted successfully',
        ]);
    }
}
