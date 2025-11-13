<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if user has required permission(s)
 *
 * Usage in routes:
 * Route::get('/users', [UserController::class, 'index'])
 *     ->middleware('permission:users.view');
 *
 * Route::get('/users/edit', [UserController::class, 'edit'])
 *     ->middleware('permission:users.view,users.edit'); // Requires ALL (AND logic)
 *
 * Route::get('/users/create', [UserController::class, 'create'])
 *     ->middleware('permission:superadmin|admin|users.create'); // Requires ANY (OR logic)
 */
class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Parse permissions: use | for OR, comma for AND
        if (str_contains($permissions, '|')) {
            // OR logic: user needs ANY of these permissions
            $permissionArray = explode('|', $permissions);
            $hasPermission = $user->hasAnyPermission($permissionArray);
        } else if (str_contains($permissions, ',')) {
            // AND logic: user needs ALL of these permissions
            $permissionArray = explode(',', $permissions);
            $hasPermission = $user->hasAllPermissions($permissionArray);
        } else {
            // Single permission
            $hasPermission = $user->hasPermission($permissions);
        }

        if (!$hasPermission) {
            // API request
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.',
                    'required_permission' => $permissions,
                ], 403);
            }

            // Web request
            abort(403, 'You do not have permission to access this resource.');
        }

        return $next($request);
    }
}