<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Permission Controller
 * Provides endpoints to check user permissions via API
 */
class PermissionController extends Controller
{
    /**
     * Get all permissions for current authenticated user
     * GET /api/auth/permissions
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'permissions' => $user->getPermissionNames(),
                'roles' => $user->groups->pluck('name')->toArray(),
                'is_superadmin' => $user->isSuperadmin(),
                'is_admin' => $user->isAdmin(),
            ],
        ]);
    }

    /**
     * Check if user has specific permission(s)
     * POST /api/auth/permissions/check
     *
     * Request body:
     * {
     *   "permissions": "users.edit"  // or ["users.edit", "users.delete"]
     *   "require_all": false  // optional, default false (OR logic)
     * }
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function check(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $validated = $request->validate([
            'permissions' => 'required',
            'require_all' => 'nullable|boolean',
        ]);

        $permissions = $validated['permissions'];
        $requireAll = $validated['require_all'] ?? false;

        $hasPermission = $user->hasPermission($permissions, $requireAll);

        return response()->json([
            'success' => true,
            'data' => [
                'has_permission' => $hasPermission,
                'checked_permissions' => is_array($permissions) ? $permissions : [$permissions],
                'logic' => $requireAll ? 'AND' : 'OR',
            ],
        ]);
    }

    /**
     * Check multiple permissions at once (batch check)
     * POST /api/auth/permissions/batch-check
     *
     * Request body:
     * {
     *   "checks": [
     *     {"name": "can_edit_users", "permissions": ["users.edit"]},
     *     {"name": "can_delete_users", "permissions": ["users.delete"]},
     *     {"name": "can_manage_users", "permissions": ["users.edit", "users.delete"], "require_all": true}
     *   ]
     * }
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function batchCheck(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $validated = $request->validate([
            'checks' => 'required|array',
            'checks.*.name' => 'required|string',
            'checks.*.permissions' => 'required',
            'checks.*.require_all' => 'nullable|boolean',
        ]);

        $results = [];

        foreach ($validated['checks'] as $check) {
            $permissions = $check['permissions'];
            $requireAll = $check['require_all'] ?? false;

            $results[$check['name']] = $user->hasPermission($permissions, $requireAll);
        }

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
