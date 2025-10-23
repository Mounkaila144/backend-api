<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class TenancyServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Événement : Initialisation du tenant (switch DB)
        Event::listen(
            \Stancl\Tenancy\Events\TenancyInitialized::class,
            function ($event) {
                $tenant = $event->tenancy->tenant;

                // Configuration dynamique de la connexion tenant
                config([
                    'database.connections.tenant' => [
                        'driver' => 'mysql',
                        'host' => $tenant->site_db_host,
                        'port' => 3306,
                        'database' => $tenant->site_db_name,
                        'username' => $tenant->site_db_login,
                        'password' => $tenant->site_db_password,
                        'charset' => 'utf8mb4',
                        'collation' => 'utf8mb4_unicode_ci',
                        'prefix' => '',
                        'strict' => true,
                        'engine' => null,
                        'options' => extension_loaded('pdo_mysql') ? array_filter([
                            \PDO::ATTR_PERSISTENT => true,
                            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,
                        ]) : [],
                    ],
                ]);

                // Purger et reconnecter
                DB::purge('tenant');
                DB::reconnect('tenant');

                // Définir comme connexion par défaut
                DB::setDefaultConnection('tenant');

                // Logger pour debug
                if (config('app.debug')) {
                    logger()->info("Tenancy initialized", [
                        'tenant_id' => $tenant->site_id,
                        'host' => $tenant->site_host,
                        'database' => $tenant->site_db_name,
                    ]);
                }
            }
        );

        // Événement : Fin du tenant (retour à central)
        Event::listen(
            \Stancl\Tenancy\Events\TenancyEnded::class,
            function () {
                // Revenir à la connexion centrale
                DB::setDefaultConnection('mysql');

                if (config('app.debug')) {
                    logger()->info("Tenancy ended, switched back to central DB");
                }
            }
        );

        // Événement : Création d'un nouveau tenant
        Event::listen(
            \Stancl\Tenancy\Events\TenantCreated::class,
            function ($event) {
                logger()->info("Tenant created", [
                    'tenant_id' => $event->tenant->site_id,
                    'host' => $event->tenant->site_host,
                ]);
            }
        );
    }
}
