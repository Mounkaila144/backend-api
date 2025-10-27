<?php

namespace Modules\UsersGuard\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\User as SuperadminUser;
use Modules\UsersGuard\Entities\User as TenantUser;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use function App\Http\Controllers\Api\now;
use function App\Http\Controllers\Api\response;
use function App\Http\Controllers\Api\tenancy;

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
