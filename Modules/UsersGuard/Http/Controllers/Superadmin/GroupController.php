<?php

namespace Modules\UsersGuard\Http\Controllers\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

/**
 * Gestion des groupes SUPERADMIN (base CENTRALE)
 * Accès aux groupes de tous les tenants pour supervision
 */
class GroupController extends Controller
{
    /**
     * Lister les groupes de tous les tenants
     * GET /api/superadmin/groups
     */
    public function index(Request $request): JsonResponse
    {
        // Récupérer tous les sites
        $sites = DB::connection('mysql')
            ->table('t_sites')
            ->where('site_available', 'YES')
            ->get();

        $allGroups = [];

        // Pour chaque site, se connecter et récupérer les groupes
        foreach ($sites as $site) {
            try {
                // Configuration temporaire
                config([
                    'database.connections.temp_tenant' => [
                        'driver' => 'mysql',
                        'host' => $site->site_db_host,
                        'database' => $site->site_db_name,
                        'username' => $site->site_db_login,
                        'password' => $site->site_db_password,
                        'charset' => 'utf8mb4',
                    ],
                ]);

                DB::purge('temp_tenant');

                // Récupérer les groupes de ce site
                $groups = DB::connection('temp_tenant')
                    ->table('t_groups')
                    ->select('id', 'name', 'application')
                    ->limit(10)
                    ->get();

                $allGroups[] = [
                    'site_id' => $site->site_id,
                    'site_host' => $site->site_host,
                    'groups_count' => $groups->count(),
                    'groups' => $groups,
                ];

            } catch (\Exception $e) {
                $allGroups[] = [
                    'site_id' => $site->site_id,
                    'site_host' => $site->site_host,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $allGroups,
        ]);
    }

    /**
     * Statistiques globales
     * GET /api/superadmin/groups/stats
     */
    public function stats(): JsonResponse
    {
        $sites = DB::connection('mysql')
            ->table('t_sites')
            ->where('site_available', 'YES')
            ->get();

        $stats = [
            'total_sites' => $sites->count(),
            'total_groups' => 0,
        ];

        foreach ($sites as $site) {
            try {
                config([
                    'database.connections.temp_tenant' => [
                        'driver' => 'mysql',
                        'host' => $site->site_db_host,
                        'database' => $site->site_db_name,
                        'username' => $site->site_db_login,
                        'password' => $site->site_db_password,
                    ],
                ]);

                DB::purge('temp_tenant');

                $count = DB::connection('temp_tenant')
                    ->table('t_groups')
                    ->count();

                $stats['total_groups'] += $count;

            } catch (\Exception $e) {
                // Ignore errors
            }
        }

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
