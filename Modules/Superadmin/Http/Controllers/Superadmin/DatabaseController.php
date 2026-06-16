<?php

namespace Modules\Superadmin\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Superadmin\Services\DatabaseProvisioningService;
use RuntimeException;

/**
 * 2 endpoints utilisés par le formulaire de création de tenant :
 *   POST /api/superadmin/databases/test       — valide les credentials
 *   POST /api/superadmin/databases/provision  — crée la DB si absente
 *
 * L'import de dump SQL n'est plus géré côté app — utilise phpMyAdmin déployé
 * dans Railway pour ça (réseau interne, beaucoup plus rapide qu'un upload via
 * notre API/proxy).
 *
 * Tous protégés par le groupe parent (`auth:sanctum` + `superadmin.host`).
 */
class DatabaseController extends Controller
{
    public function __construct(private readonly DatabaseProvisioningService $service)
    {
    }

    public function test(Request $request): JsonResponse
    {
        $data = $request->validate([
            'host'     => 'required|string|max:255',
            'port'     => 'required|integer|between:1,65535',
            'username' => 'required|string|max:128',
            'password' => 'present|string|max:255',
            'database' => 'nullable|string|max:64|regex:/^[A-Za-z0-9_]+$/',
        ]);

        $result = $this->service->testConnection(
            $data['host'],
            (int) $data['port'],
            $data['username'],
            $data['password'],
            $data['database'] ?? null,
        );

        return response()->json([
            'success' => $result['can_connect'],
            'data'    => $result,
        ], $result['can_connect'] ? 200 : 422);
    }

    public function provision(Request $request): JsonResponse
    {
        $data = $request->validate([
            'host'     => 'required|string|max:255',
            'port'     => 'required|integer|between:1,65535',
            'username' => 'required|string|max:128',
            'password' => 'present|string|max:255',
            'database' => 'required|string|max:64|regex:/^[A-Za-z0-9_]+$/',
        ]);

        try {
            $result = $this->service->provisionDatabase(
                $data['host'],
                (int) $data['port'],
                $data['username'],
                $data['password'],
                $data['database'],
            );

            return response()->json([
                'success' => true,
                'data'    => $result,
                'message' => $result['already_existed']
                    ? "DB '{$data['database']}' existait déjà"
                    : "DB '{$data['database']}' créée",
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

}
