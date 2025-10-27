<?php

namespace Modules\Dashboard\Http\Controllers\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Dashboard\Repositories\MenuRepository;
use Modules\Dashboard\Entities\SystemMenu;
use Illuminate\Support\Facades\Validator;

/**
 * Superadmin Menu Controller
 *
 * Handles menu management for superadmin area
 * Note: Superadmin can manage menus across all tenants if needed
 */
class MenuController extends Controller
{
    protected MenuRepository $menuRepository;

    public function __construct(MenuRepository $menuRepository)
    {
        $this->menuRepository = $menuRepository;
    }

    /**
     * Get menu tree structure
     *
     * GET /api/superadmin/menus/tree
     */
    public function tree(Request $request): JsonResponse
    {
        $lang = $request->get('lang', 'en');
        $parentId = $request->get('parent_id');

        $tree = $this->menuRepository->getTree($lang, $parentId);

        return response()->json([
            'success' => true,
            'data' => $tree,
        ]);
    }

    /**
     * Get paginated menu list
     *
     * GET /api/superadmin/menus
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 20);
        $lang = $request->get('lang', 'en');
        $filters = $request->only(['level', 'type', 'module', 'search']);

        $menus = $this->menuRepository->getPaginated($perPage, $lang, $filters);

        return response()->json([
            'success' => true,
            'data' => $menus,
        ]);
    }

    /**
     * Get single menu with details
     *
     * GET /api/superadmin/menus/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $lang = $request->get('lang', 'en');

        $menu = SystemMenu::with(['translations' => function ($query) use ($lang) {
            $query->where('lang', $lang);
        }])->find($id);

        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Menu not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $menu,
        ]);
    }

    /**
     * Create new menu
     *
     * POST /api/superadmin/menus
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255|unique:tenant.t_system_menu,name',
            'menu' => 'nullable|string|max:255',
            'module' => 'nullable|string|max:255',
            'parent_id' => 'nullable|integer|exists:tenant.t_system_menu,id',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'type' => 'nullable|in:SYSTEM,USER',
            'translations' => 'nullable|array',
            'translations.*' => 'string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->only(['name', 'menu', 'module', 'status', 'type']);
            $translations = $request->get('translations', []);
            $parentId = $request->get('parent_id');

            if ($parentId) {
                $menu = $this->menuRepository->createAsLastChild($parentId, $data, $translations);
            } else {
                $menu = $this->menuRepository->createRoot($data, $translations);
            }

            return response()->json([
                'success' => true,
                'message' => 'Menu created successfully',
                'data' => $menu,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create menu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update menu
     *
     * PUT /api/superadmin/menus/{id}
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255|unique:tenant.t_system_menu,name,' . $id,
            'menu' => 'nullable|string|max:255',
            'module' => 'nullable|string|max:255',
            'status' => 'nullable|in:ACTIVE,DELETE',
            'type' => 'nullable|in:SYSTEM,USER',
            'translations' => 'nullable|array',
            'translations.*' => 'string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->only(['name', 'menu', 'module', 'status', 'type']);
            $translations = $request->get('translations', []);

            $menu = $this->menuRepository->update($id, $data, $translations);

            return response()->json([
                'success' => true,
                'message' => 'Menu updated successfully',
                'data' => $menu,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update menu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Move menu to new position
     *
     * POST /api/superadmin/menus/{id}/move
     */
    public function move(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'target_id' => 'required|integer|exists:tenant.t_system_menu,id',
            'position' => 'required|in:prev_sibling,next_sibling,first_child,last_child',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $targetId = $request->get('target_id');
            $position = $request->get('position');

            $menu = match ($position) {
                'prev_sibling' => $this->menuRepository->moveAsPrevSibling($id, $targetId),
                'first_child' => $this->menuRepository->moveAsFirstChild($id, $targetId),
                default => throw new \Exception('Position not yet implemented'),
            };

            return response()->json([
                'success' => true,
                'message' => 'Menu moved successfully',
                'data' => $menu,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to move menu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete menu (soft delete)
     *
     * DELETE /api/superadmin/menus/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->menuRepository->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Menu deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete menu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Hard delete menu (permanent)
     *
     * DELETE /api/superadmin/menus/{id}/hard
     */
    public function hardDestroy(int $id): JsonResponse
    {
        try {
            $this->menuRepository->hardDelete($id);

            return response()->json([
                'success' => true,
                'message' => 'Menu permanently deleted',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete menu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rebuild menu tree (fix corrupted lb/rb)
     *
     * POST /api/superadmin/menus/rebuild
     */
    public function rebuild(): JsonResponse
    {
        try {
            $this->menuRepository->rebuildTree();

            return response()->json([
                'success' => true,
                'message' => 'Menu tree rebuilt successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to rebuild menu tree',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all menu types and modules for filtering
     *
     * GET /api/superadmin/menus/metadata
     */
    public function metadata(): JsonResponse
    {
        $types = [
            SystemMenu::TYPE_SYSTEM,
            SystemMenu::TYPE_USER,
        ];

        $statuses = [
            SystemMenu::STATUS_ACTIVE,
            SystemMenu::STATUS_DELETE,
        ];

        $modules = SystemMenu::select('module')
            ->distinct()
            ->whereNotNull('module')
            ->pluck('module')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'types' => $types,
                'statuses' => $statuses,
                'modules' => $modules,
                'max_level' => SystemMenu::MAX_LEVEL,
            ],
        ]);
    }
}
