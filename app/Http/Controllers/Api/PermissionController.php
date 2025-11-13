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
                'groups' => $user->groups->pluck('name')->toArray(),
                'is_superadmin' => $user->isSuperadmin(),
                'is_admin' => $user->isAdmin(),
                'user_id' => $user->id,
                'username' => $user->username,
            ],
        ]);
    }

    /**
     * Check if user has specific credential(s) - Symfony 1 style
     * POST /api/auth/permissions/check
     *
     * Request body:
     * {
     *   "credentials": "admin"  // or ["admin", "superadmin"] or [["admin", "superadmin"]]
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
            'credentials' => 'required',
            'require_all' => 'nullable|boolean',
        ]);

        $credentials = $validated['credentials'];
        $requireAll = $validated['require_all'] ?? false;

        // Utiliser hasCredential au lieu de hasPermission (Symfony 1 compatible)
        $hasCredential = $user->hasCredential($credentials, $requireAll);

        return response()->json([
            'success' => true,
            'data' => [
                'has_credential' => $hasCredential,
                'checked_credentials' => is_array($credentials) ? $credentials : [$credentials],
                'logic' => $requireAll ? 'AND' : 'OR',
            ],
        ]);
    }

    /**
     * Check multiple credentials at once (batch check) - Symfony 1 style
     * POST /api/auth/permissions/batch-check
     *
     * Request body:
     * {
     *   "checks": [
     *     {"name": "can_edit_users", "credentials": ["admin", "users.edit"]},
     *     {"name": "can_delete_users", "credentials": ["admin", "users.delete"]},
     *     {"name": "can_manage_users", "credentials": ["users.edit", "users.delete"], "require_all": true}
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
            'checks.*.credentials' => 'required',
            'checks.*.require_all' => 'nullable|boolean',
        ]);

        $results = [];

        foreach ($validated['checks'] as $check) {
            $credentials = $check['credentials'];
            $requireAll = $check['require_all'] ?? false;

            // Utiliser hasCredential au lieu de hasPermission (Symfony 1 compatible)
            $results[$check['name']] = $user->hasCredential($credentials, $requireAll);
        }

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
