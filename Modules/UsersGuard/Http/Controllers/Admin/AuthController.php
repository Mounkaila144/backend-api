<?php

namespace Modules\UsersGuard\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User as SuperadminUser;
use Modules\UsersGuard\Entities\User as TenantUser;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Vérifier le mot de passe (supporte MD5 legacy et bcrypt)
     */
    private function checkPassword(string $plainPassword, string $hashedPassword): bool
    {
        // Si le hash fait 60 caractères, c'est bcrypt
        if (strlen($hashedPassword) === 60) {
            return Hash::check($plainPassword, $hashedPassword);
        }

        // Si le hash fait 32 caractères, c'est MD5 (legacy)
        if (strlen($hashedPassword) === 32) {
            return md5($plainPassword) === $hashedPassword;
        }

        // Format inconnu
        return false;
    }

    /**
     * Login TENANT (base du site)
     * POST /api/auth/login
     * Header requis: X-Tenant-ID
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'application' => 'required|in:admin,frontend',
        ]);

        // Le middleware 'tenant' a déjà initialisé la connexion
        // On cherche donc dans la base TENANT

        $user = TenantUser::where('username', $validated['username'])
            ->where('application', $validated['application'])
            ->active()
            ->first();

        if (!$user || !$this->checkPassword($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials'],
            ]);
        }

        // Créer token avec le tenant_id
        $token = $user->createToken('tenant-token', [
            'role:' . $validated['application'],
            'tenant:' . tenancy()->tenant->site_id,
        ])->plainTextToken;

        // Charger les relations
        $user->load(['groups.permissions', 'permissions']);

        // Mettre à jour last login
        DB::connection('tenant')->table('t_users')
            ->where('id', $user->id)
            ->update(['lastlogin' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'application' => $user->application,
                    'groups' => $user->groups,
                    'permissions' => $user->permissions,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
                'tenant' => [
                    'id' => tenancy()->tenant->site_id,
                    'host' => tenancy()->tenant->site_host,
                    'database' => tenancy()->tenant->site_db_name,
                ],
            ],
        ]);
    }

    /**
     * Get current user (superadmin ou tenant)
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Déterminer si c'est un superadmin ou tenant user
        $isSuperadmin = $user->application === 'superadmin';

        if (!$isSuperadmin && tenancy()->initialized) {
            // User tenant : charger les relations
            $user->load(['groups.permissions', 'permissions']);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'tenant' => $isSuperadmin ? null : [
                    'id' => tenancy()->tenant?->site_id,
                    'host' => tenancy()->tenant?->site_host,
                ],
            ],
        ]);
    }

    /**
     * Logout
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Refresh token
     * POST /api/auth/refresh
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Déterminer les abilities
        $abilities = [];
        if ($user->application === 'superadmin') {
            $abilities = ['role:superadmin'];
        } else {
            $abilities = [
                'role:' . $user->application,
                'tenant:' . tenancy()->tenant?->site_id,
            ];
        }

        // Révoquer l'ancien token
        $request->user()->currentAccessToken()->delete();

        // Créer nouveau token
        $token = $user->createToken('refreshed-token', $abilities)->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }
}
