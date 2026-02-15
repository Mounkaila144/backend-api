<?php

namespace Modules\Site\Repositories;

use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Repository pour gérer les sites/tenants
 * Centralise toute la logique métier liée aux sites
 */
class SiteRepository
{
    /**
     * Récupérer tous les sites avec pagination et filtres
     */
    public function getAllPaginated(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = Tenant::query();

        // Filtre par recherche (host, db_name, company)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('site_host', 'LIKE', "%{$search}%")
                  ->orWhere('site_db_name', 'LIKE', "%{$search}%")
                  ->orWhere('site_company', 'LIKE', "%{$search}%");
            });
        }

        // Filtre par disponibilité
        if (isset($filters['available'])) {
            $query->where('site_available', $filters['available'] ? 'YES' : 'NO');
        }

        // Filtre par admin disponible
        if (isset($filters['admin_available'])) {
            $query->where('site_admin_available', $filters['admin_available'] ? 'YES' : 'NO');
        }

        // Filtre par frontend disponible
        if (isset($filters['frontend_available'])) {
            $query->where('site_frontend_available', $filters['frontend_available'] ? 'YES' : 'NO');
        }

        // Filtre par type
        if (!empty($filters['type'])) {
            $query->where('site_type', $filters['type']);
        }

        // Filtre par client
        if (isset($filters['is_customer'])) {
            $query->where('is_customer', $filters['is_customer'] ? 'YES' : 'NO');
        }

        // Tri
        $sortBy = $filters['sort_by'] ?? 'site_host';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Récupérer tous les sites sans pagination
     */
    public function getAll(array $filters = []): Collection
    {
        $query = Tenant::query();

        if (!empty($filters['available'])) {
            $query->where('site_available', 'YES');
        }

        return $query->orderBy('site_host')->get();
    }

    /**
     * Trouver un site par ID
     */
    public function find(int $id): ?Tenant
    {
        return Tenant::find($id);
    }

    /**
     * Trouver un site par ID ou échouer
     */
    public function findOrFail(int $id): Tenant
    {
        return Tenant::findOrFail($id);
    }

    /**
     * Trouver un site par host
     */
    public function findByHost(string $host): ?Tenant
    {
        return Tenant::where('site_host', $host)->first();
    }

    /**
     * Trouver un site par nom de base de données
     */
    public function findByDatabaseName(string $dbName): ?Tenant
    {
        return Tenant::where('site_db_name', $dbName)->first();
    }

    /**
     * Créer un nouveau site
     */
    public function create(array $data): Tenant
    {
        DB::beginTransaction();

        try {
            // Créer la base de données du tenant si demandé
            if (!empty($data['create_database'])) {
                $this->createTenantDatabase($data);
            }

            // Retirer les options qui ne sont pas des colonnes de la table
            $createDatabase = $data['create_database'] ?? false;
            $setupTables = $data['setup_tables'] ?? false;
            unset($data['create_database'], $data['setup_tables']);

            // Ajouter les valeurs par défaut pour les champs requis
            $defaults = [
                'site_admin_theme' => 'default',
                'site_admin_theme_base' => 'default',
                'site_frontend_theme' => 'default',
                'site_frontend_theme_base' => 'default',
                'site_admin_available' => 'NO',
                'site_frontend_available' => 'NO',
                'site_available' => 'YES',
                'site_type' => 'CUST',
                'is_customer' => 'YES',
                'is_uptodate' => 'NO',
                'site_access_restricted' => 0,
                'site_master' => '',
                'site_db_password' => '',
                'logo' => '',
                'picture' => '',
                'banner' => '',
                'favicon' => '',
                'site_company' => '',
                'price' => '0.00',
                'site_db_size' => 0,
                'site_size' => 0,
            ];

            // Fusionner avec les valeurs par défaut
            // Filtrer les valeurs null ET les chaînes vides pour site_db_password
            $data = array_merge($defaults, array_filter($data, function($value, $key) {
                if ($key === 'site_db_password' && $value === '') {
                    return false; // Ne pas inclure site_db_password vide
                }
                return $value !== null;
            }, ARRAY_FILTER_USE_BOTH));

            // Créer l'entrée dans t_sites avec une requête directe
            $siteId = DB::connection('mysql')
                ->table('t_sites')
                ->insertGetId($data);

            // Récupérer le site créé
            $site = $this->findOrFail($siteId);

            // Initialiser les tables du tenant si demandé
            if ($setupTables) {
                $this->setupTenantTables($site);
            }

            DB::commit();

            return $site;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Mettre à jour un site
     */
    public function update(Tenant $site, array $data): Tenant
    {
        // S'assurer que site_db_password est une chaîne vide et non null
        // (la colonne n'accepte pas NULL mais accepte les chaînes vides)
        if (array_key_exists('site_db_password', $data) && $data['site_db_password'] === null) {
            $data['site_db_password'] = '';
        }

        // Utiliser une requête directe pour éviter les problèmes avec le modèle Stancl Tenancy
        DB::connection('mysql')
            ->table('t_sites')
            ->where('site_id', $site->site_id)
            ->update($data);

        // Recharger le site depuis la base de données
        return $this->findOrFail($site->site_id);
    }

    /**
     * Supprimer un site
     */
    public function delete(Tenant $site, bool $deleteDatabase = false): bool
    {
        DB::beginTransaction();

        try {
            // Supprimer la base de données si demandé
            if ($deleteDatabase) {
                $this->dropTenantDatabase($site);
            }

            // Supprimer l'entrée
            $site->delete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Tester la connexion à un site
     */
    public function testConnection(Tenant $site): array
    {
        try {
            $port = $site->site_db_port ?? 3306;
            $dsn = "mysql:host={$site->site_db_host};port={$port};dbname={$site->site_db_name}";

            $options = [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 10, // Timeout de 10 secondes
            ];

            // Configuration SSL si activée
            if ($site->site_db_ssl_enabled === 'YES') {
                $sslMode = $site->site_db_ssl_mode ?? 'REQUIRED';

                // Vérification du certificat serveur
                if (in_array($sslMode, ['VERIFY_CA', 'VERIFY_IDENTITY'])) {
                    $options[\PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
                } else {
                    $options[\PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                }

                // Certificat CA
                if (!empty($site->site_db_ssl_ca)) {
                    // Si c'est un chemin de fichier existant
                    if (file_exists($site->site_db_ssl_ca)) {
                        $options[\PDO::MYSQL_ATTR_SSL_CA] = $site->site_db_ssl_ca;
                    } else {
                        // Si c'est le contenu du certificat, on le sauvegarde temporairement
                        $tempCaFile = storage_path('app/ssl/tenant_' . $site->site_id . '_ca.pem');
                        $sslDir = dirname($tempCaFile);
                        if (!is_dir($sslDir)) {
                            mkdir($sslDir, 0755, true);
                        }
                        file_put_contents($tempCaFile, $site->site_db_ssl_ca);
                        $options[\PDO::MYSQL_ATTR_SSL_CA] = $tempCaFile;
                    }
                }
            }

            // Si le mot de passe est vide, passer null pour une connexion sans mot de passe
            $password = !empty($site->site_db_password) ? $site->site_db_password : null;

            $pdo = new \PDO(
                $dsn,
                $site->site_db_login,
                $password,
                $options
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

            return [
                'success' => true,
                'database' => $site->site_db_name,
                'host' => $site->site_db_host,
                'port' => $port,
                'ssl_enabled' => $site->site_db_ssl_enabled === 'YES',
                'tables_count' => count($tables),
                'users_count' => $usersCount,
                'tables' => $tables,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'host' => $site->site_db_host,
                'port' => $site->site_db_port ?? 3306,
                'ssl_enabled' => $site->site_db_ssl_enabled === 'YES',
            ];
        }
    }

    /**
     * Obtenir les statistiques des sites
     */
    public function getStatistics(): array
    {
        return [
            'total' => Tenant::count(),
            'available' => Tenant::where('site_available', 'YES')->count(),
            'unavailable' => Tenant::where('site_available', 'NO')->count(),
            'customers' => Tenant::where('is_customer', 'YES')->count(),
            'admin_available' => Tenant::where('site_admin_available', 'YES')->count(),
            'frontend_available' => Tenant::where('site_frontend_available', 'YES')->count(),
        ];
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
        if (!empty($data['site_db_login']) && $data['site_db_login'] !== 'root') {
            $user = $data['site_db_login'];
            $password = $data['site_db_password'];
            $host = $data['site_db_host'] ?? 'localhost';

            // Créer l'utilisateur s'il n'existe pas
            DB::connection('mysql')->statement(
                "CREATE USER IF NOT EXISTS '{$user}'@'{$host}'
                IDENTIFIED BY '{$password}'"
            );

            // Donner les privilèges
            DB::connection('mysql')->statement(
                "GRANT ALL PRIVILEGES ON `{$dbName}`.*
                TO '{$user}'@'{$host}'"
            );

            DB::connection('mysql')->statement("FLUSH PRIVILEGES");
        }
    }

    /**
     * Supprimer la base de données du tenant
     */
    protected function dropTenantDatabase(Tenant $site): void
    {
        DB::connection('mysql')->statement(
            "DROP DATABASE IF EXISTS `{$site->site_db_name}`"
        );

        // Optionnel : Supprimer l'utilisateur MySQL
        if ($site->site_db_login !== 'root') {
            try {
                DB::connection('mysql')->statement(
                    "DROP USER IF EXISTS '{$site->site_db_login}'@'{$site->site_db_host}'"
                );
            } catch (\Exception $e) {
                // L'utilisateur peut être utilisé par d'autres bases
            }
        }
    }

    /**
     * Initialiser les tables de base dans le tenant
     */
    protected function setupTenantTables(Tenant $site): void
    {
        // Configuration temporaire pour se connecter au tenant
        // Si le mot de passe est vide, passer null pour une connexion sans mot de passe
        $password = !empty($site->site_db_password) ? $site->site_db_password : null;

        $config = [
            'driver' => 'mysql',
            'host' => $site->site_db_host,
            'port' => $site->site_db_port ?? 3306,
            'database' => $site->site_db_name,
            'username' => $site->site_db_login,
            'password' => $password,
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ];

        // Configuration SSL si activée
        if ($site->site_db_ssl_enabled === 'YES') {
            $sslOptions = [];
            $sslMode = $site->site_db_ssl_mode ?? 'REQUIRED';

            if (in_array($sslMode, ['VERIFY_CA', 'VERIFY_IDENTITY'])) {
                $sslOptions[\PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
            } else {
                $sslOptions[\PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            if (!empty($site->site_db_ssl_ca)) {
                if (file_exists($site->site_db_ssl_ca)) {
                    $sslOptions[\PDO::MYSQL_ATTR_SSL_CA] = $site->site_db_ssl_ca;
                } else {
                    $tempCaFile = storage_path('app/ssl/tenant_' . $site->site_id . '_ca.pem');
                    $sslDir = dirname($tempCaFile);
                    if (!is_dir($sslDir)) {
                        mkdir($sslDir, 0755, true);
                    }
                    file_put_contents($tempCaFile, $site->site_db_ssl_ca);
                    $sslOptions[\PDO::MYSQL_ATTR_SSL_CA] = $tempCaFile;
                }
            }

            if (!empty($sslOptions)) {
                $config['options'] = $sslOptions;
            }
        }

        config(['database.connections.temp_tenant' => $config]);

        DB::purge('temp_tenant');

        // Option 1: Exécuter un fichier SQL template
        $templatePath = database_path('tenant_template.sql');
        if (file_exists($templatePath)) {
            $sql = file_get_contents($templatePath);
            DB::connection('temp_tenant')->unprepared($sql);
        }

        // Option 2: Copier depuis un tenant existant (template)
        // Vous pouvez implémenter cette logique selon vos besoins
    }

    /**
     * Exécuter les migrations tenant et activer le site
     *
     * @return array{success: bool, message: string, output?: string}
     */
    public function runTenantMigrations(Tenant $site): array
    {
        try {
            $exitCode = Artisan::call('tenants:migrate', [
                '--tenants' => [$site->site_id],
                '--force' => true,
            ]);

            $output = Artisan::output();

            if ($exitCode === 0) {
                DB::connection('mysql')
                    ->table('t_sites')
                    ->where('site_id', $site->site_id)
                    ->update([
                        'site_available' => 'YES',
                        'site_admin_available' => 'YES',
                        'site_frontend_available' => 'YES',
                        'is_uptodate' => 'YES',
                    ]);

                return [
                    'success' => true,
                    'message' => 'Migrations exécutées avec succès. Site activé.',
                    'output' => $output,
                ];
            }

            DB::connection('mysql')
                ->table('t_sites')
                ->where('site_id', $site->site_id)
                ->update([
                    'is_uptodate' => 'NO',
                ]);

            return [
                'success' => false,
                'message' => 'Les migrations ont échoué.',
                'output' => $output,
            ];
        } catch (\Exception $e) {
            DB::connection('mysql')
                ->table('t_sites')
                ->where('site_id', $site->site_id)
                ->update([
                    'is_uptodate' => 'NO',
                ]);

            return [
                'success' => false,
                'message' => 'Erreur lors de l\'exécution des migrations: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Mettre à jour la taille de la base de données
     */
    public function updateDatabaseSize(Tenant $site): void
    {
        try {
            $size = DB::connection('mysql')
                ->table('information_schema.TABLES')
                ->where('table_schema', $site->site_db_name)
                ->selectRaw('SUM(data_length + index_length) as size')
                ->value('size');

            $site->update(['site_db_size' => $size]);
        } catch (\Exception $e) {
            // Ignorer l'erreur si on ne peut pas calculer la taille
        }
    }
}
