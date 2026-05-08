<?php

namespace Modules\UsersGuard\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\UsersGuard\Entities\User as TenantUser;

class AuthController extends Controller
{
    /**
     * Vérifie le mot de passe (supporte MD5 legacy ET bcrypt).
     * Auth::attempt n'est pas utilisable ici parce qu'il appelle Hash::check
     * qui rejette les hash MD5 hérités du Symfony 1.
     */
    private function checkPassword(string $plainPassword, string $hashedPassword): bool
    {
        if (strlen($hashedPassword) === 60) {
            return Hash::check($plainPassword, $hashedPassword);
        }

        if (strlen($hashedPassword) === 32) {
            return md5($plainPassword) === $hashedPassword;
        }

        return false;
    }

    /**
     * Login TENANT (Sanctum SPA — session cookie).
     * POST /api/admin/auth/login
     * Header requis : X-Tenant-ID (consommé par InitializeTenancy)
     *
     * Le frontend doit avoir appelé GET /sanctum/csrf-cookie avant pour récupérer
     * le cookie XSRF-TOKEN qu'il renvoie en X-XSRF-TOKEN sur ce POST.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username'    => 'required|string',
            'password'    => 'required|string',
            'application' => 'required|in:admin,frontend',
        ]);

        $tenant = tenancy()->tenant;
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant context not initialized',
            ], 500);
        }

        $user = TenantUser::where('username', $validated['username'])
            ->where('application', $validated['application'])
            ->active()
            ->first();

        if (!$user || !$this->checkPassword($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials'],
            ]);
        }

        // Établir la session SPA. Si une session superadmin coexiste dans le navigateur,
        // on la révoque pour éviter qu'un seul cookie débouche sur deux identités.
        Auth::guard('superadmin')->logout();
        Auth::guard('admin')->login($user);

        // Rotation de l'ID de session pour parer le session fixation.
        $request->session()->regenerate();

        // Stocker le binding tenant côté session — vérifié à chaque requête par
        // InitializeTenancy::detectTenantBindingMismatch.
        $request->session()->put('tenant_site_id', (int) $tenant->site_id);

        $user->load(['groups.permissions', 'permissions']);

        DB::connection('tenant')->table('t_users')
            ->where('id', $user->id)
            ->update(['lastlogin' => now()]);

        return response()->json([
            'success' => true,
            'message' => __('User login successfully'),
            'data' => [
                'user' => [
                    'id'          => $user->id,
                    'username'    => $user->username,
                    'email'       => $user->email,
                    'firstname'   => $user->firstname,
                    'lastname'    => $user->lastname,
                    'application' => $user->application,
                    'groups'      => $user->groups,
                    'permissions' => $user->permissions,
                ],
                'tenant' => [
                    'id'       => $tenant->site_id,
                    'host'     => $tenant->site_host,
                    'database' => $tenant->site_db_name,
                ],
            ],
        ]);
    }

    /**
     * Renvoie l'utilisateur courant (admin ou superadmin selon la session active).
     * GET /api/admin/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = Auth::guard('admin')->user() ?? Auth::guard('superadmin')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $isSuperadmin = ($user->application ?? null) === 'superadmin';

        if (!$isSuperadmin && method_exists($user, 'load')) {
            $user->load(['groups.permissions', 'permissions']);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user'   => $user,
                'tenant' => $isSuperadmin ? null : [
                    'id'   => tenancy()->tenant?->site_id,
                    'host' => tenancy()->tenant?->site_host,
                ],
            ],
        ]);
    }

    /**
     * Logout — détruit la session.
     * POST /api/admin/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }
}
