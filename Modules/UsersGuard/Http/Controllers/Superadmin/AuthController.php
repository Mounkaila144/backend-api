<?php

namespace Modules\UsersGuard\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\User as SuperadminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Vérifie le mot de passe (supporte MD5 legacy ET bcrypt — héritage Symfony 1).
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
     * Login SUPERADMIN (Sanctum SPA — session cookie, base centrale).
     * POST /api/superadmin/auth/login
     * Pas de header X-Tenant-ID requis.
     *
     * Le frontend doit avoir appelé GET /sanctum/csrf-cookie avant.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username'    => 'required|string',
            'password'    => 'required|string',
            'application' => 'required|in:superadmin,admin',
        ]);

        $user = SuperadminUser::where('username', $validated['username'])
            ->where('application', $validated['application'])
            ->active()
            ->first();

        if (!$user || !$this->checkPassword($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials'],
            ]);
        }

        // Si une session admin tenant coexiste dans ce navigateur, on la révoque pour
        // éviter qu'un seul cookie débouche sur deux identités.
        Auth::guard('admin')->logout();
        Auth::guard('superadmin')->login($user);

        $request->session()->regenerate();

        // Pas de tenant_site_id en session pour les superadmins — ils traversent les tenants.
        $request->session()->forget('tenant_site_id');

        DB::connection('mysql')->table('t_users')
            ->where('id', $user->id)
            ->update(['lastlogin' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id'          => $user->id,
                    'username'    => $user->username,
                    'email'       => $user->email,
                    'firstname'   => $user->firstname,
                    'lastname'    => $user->lastname,
                    'application' => $user->application,
                ],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = Auth::guard('superadmin')->user() ?? Auth::guard('admin')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $isSuperadmin = ($user->application ?? null) === 'superadmin';

        if (!$isSuperadmin && tenancy()->initialized && method_exists($user, 'load')) {
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
     * POST /api/superadmin/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('superadmin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }
}
