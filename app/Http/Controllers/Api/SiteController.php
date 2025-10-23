<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class SiteController extends Controller
{
    /**
     * Lister tous les sites
     * GET /api/superadmin/sites
     */
    public function index(Request $request): JsonResponse
    {
        $sites = Tenant::select([
            'site_id',
            'site_host',
            'site_db_name',
            'site_db_host',
            'site_available',
            'site_admin_theme',
            'site_frontend_theme'
        ])
            ->when($request->get('search'), function ($query, $search) {
                $query->where('site_host', 'LIKE', "%{$search}%");
            })
            ->when($request->get('available'), function ($query) {
                $query->where('site_available', 'YES');
            })
            ->orderBy('site_host')
            ->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $sites->items(),
            'meta' => [
                'current_page' => $sites->currentPage(),
                'total' => $sites->total(),
                'per_page' => $sites->perPage(),
                'last_page' => $sites->lastPage(),
            ],
        ]);
    }

    /**
     * Afficher un site
     * GET /api/superadmin/sites/{id}
     */
    public function show($id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'site_id' => $site->site_id,
                'site_host' => $site->site_host,
                'site_db_name' => $site->site_db_name,
                'site_db_host' => $site->site_db_host,
                'site_db_login' => $site->site_db_login,
                'site_available' => $site->site_available,
                'site_admin_theme' => $site->site_admin_theme,
                'site_frontend_theme' => $site->site_frontend_theme,
            ],
        ]);
    }

    /**
     * Créer un nouveau site (avec sa base de données)
     * POST /api/superadmin/sites
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_host' => 'required|string|unique:t_sites,site_host',
            'site_db_name' => 'required|string|unique:t_sites,site_db_name',
            'site_db_login' => 'required|string',
            'site_db_password' => 'required|string',
            'site_db_host' => 'required|string',
            'site_admin_theme' => 'nullable|string',
            'site_frontend_theme' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // 1. Créer la base de données du site
            $this->createTenantDatabase($validated);

            // 2. Créer l'entrée dans t_sites
            $site = Tenant::create([
                'site_host' => $validated['site_host'],
                'site_db_name' => $validated['site_db_name'],
                'site_db_login' => $validated['site_db_login'],
                'site_db_password' => $validated['site_db_password'],
                'site_db_host' => $validated['site_db_host'],
                'site_admin_theme' => $validated['site_admin_theme'] ?? 'default',
                'site_frontend_theme' => $validated['site_frontend_theme'] ?? 'default',
                'site_available' => 'YES',
            ]);

            // 3. Créer les tables de base dans le tenant
            // Note: Vous pouvez copier la structure depuis un template
            $this->setupTenantTables($site);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Site created successfully',
                'data' => $site,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create site: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour un site
     * PUT /api/superadmin/sites/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        $validated = $request->validate([
            'site_host' => 'sometimes|string|unique:t_sites,site_host,' . $id . ',site_id',
            'site_available' => 'sometimes|in:YES,NO',
            'site_admin_theme' => 'sometimes|string',
            'site_frontend_theme' => 'sometimes|string',
        ]);

        $site->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Site updated successfully',
            'data' => $site,
        ]);
    }

    /**
     * Supprimer un site
     * DELETE /api/superadmin/sites/{id}
     */
    public function destroy($id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        // Optionnel: Supprimer aussi la base de données
        // ATTENTION: Cette opération est irréversible!
        if (request()->get('delete_database') === true) {
            try {
                DB::statement("DROP DATABASE IF EXISTS `{$site->site_db_name}`");
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete database: ' . $e->getMessage(),
                ], 500);
            }
        }

        $site->delete();

        return response()->json([
            'success' => true,
            'message' => 'Site deleted successfully',
        ]);
    }

    /**
     * Tester la connexion à un site
     * POST /api/superadmin/sites/{id}/test-connection
     */
    public function testConnection($id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        try {
            // Tester la connexion PDO
            $pdo = new \PDO(
                "mysql:host={$site->site_db_host};dbname={$site->site_db_name}",
                $site->site_db_login,
                $site->site_db_password
            );

            // Compter les tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            // Compter les users si la table existe
            $usersCount = 0;
            if (in_array('t_users', $tables)) {
                $stmt = $pdo->query("SELECT COUNT(*) FROM t_users");
                $usersCount = $stmt->fetchColumn();
            }

            return response()->json([
                'success' => true,
                'message' => 'Connection successful',
                'data' => [
                    'database' => $site->site_db_name,
                    'host' => $site->site_db_host,
                    'tables_count' => count($tables),
                    'users_count' => $usersCount,
                    'tables' => $tables,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer la base de données du tenant
     */
    protected function createTenantDatabase(array $data): void
    {
        $dbName = $data['site_db_name'];

        // Créer la base de données
        DB::connection('mysql')->statement(
            "CREATE DATABASE IF NOT EXISTS `{$dbName}`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        // Créer l'utilisateur MySQL (si différent de root)
        if ($data['site_db_login'] !== 'root') {
            $user = $data['site_db_login'];
            $password = $data['site_db_password'];
            $host = $data['site_db_host'];

            DB::connection('mysql')->statement(
                "CREATE USER IF NOT EXISTS '{$user}'@'{$host}'
                IDENTIFIED BY '{$password}'"
            );

            DB::connection('mysql')->statement(
                "GRANT ALL PRIVILEGES ON `{$dbName}`.*
                TO '{$user}'@'{$host}'"
            );

            DB::connection('mysql')->statement("FLUSH PRIVILEGES");
        }
    }

    /**
     * Créer les tables de base dans le tenant
     * Option: Copier depuis un template ou utiliser vos fichiers SQL
     */
    protected function setupTenantTables(Tenant $site): void
    {
        // Configuration temporaire
        config([
            'database.connections.new_tenant' => [
                'driver' => 'mysql',
                'host' => $site->site_db_host,
                'database' => $site->site_db_name,
                'username' => $site->site_db_login,
                'password' => $site->site_db_password,
                'charset' => 'utf8mb4',
            ],
        ]);

        DB::purge('new_tenant');

        // Option 1: Exécuter un fichier SQL template
        // $sql = file_get_contents(base_path('database/tenant_template.sql'));
        // DB::connection('new_tenant')->unprepared($sql);

        // Option 2: Créer les tables manuellement (exemple)
        DB::connection('new_tenant')->statement("
            CREATE TABLE IF NOT EXISTS `t_users` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `username` varchar(255) NOT NULL,
                `email` varchar(255) NOT NULL,
                `password` varchar(255) NOT NULL,
                `firstname` varchar(100) DEFAULT NULL,
                `lastname` varchar(100) DEFAULT NULL,
                `application` varchar(50) NOT NULL,
                `is_active` tinyint(1) DEFAULT 1,
                PRIMARY KEY (`id`),
                UNIQUE KEY `username` (`username`,`application`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Ajouter d'autres tables selon vos besoins...
    }
}
