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

                // Utiliser la configuration dynamique du tenant (inclut SSL et port personnalisé)
                $connectionConfig = $tenant->database()->connection();

                config(['database.connections.tenant' => $connectionConfig]);

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
                        'port' => $connectionConfig['port'] ?? 3306,
                        'ssl_enabled' => isset($connectionConfig['options'][\PDO::MYSQL_ATTR_SSL_CA]),
                    ]);
                }
            }
        );

        // Événement : Fin du tenant (retour à central)
        Event::listen(
            \Stancl\Tenancy\Events\TenancyEnded::class,
            function () {
                // Revenir à la connexion centrale. On lit la config au lieu
                // de hard-coder 'mysql' pour rester aligné avec la config
                // tenancy.database.central_connection (et le fallback DB_CONNECTION).
                $central = config('tenancy.database.central_connection') ?: 'mysql';
                DB::setDefaultConnection($central);

                if (config('app.debug')) {
                    logger()->info("Tenancy ended, switched back to central DB ({$central})");
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
