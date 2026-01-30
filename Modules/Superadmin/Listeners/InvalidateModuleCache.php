<?php

namespace Modules\Superadmin\Listeners;

use Modules\Superadmin\Services\ModuleCacheService;
use Modules\Superadmin\Events\ModuleActivated;
use Modules\Superadmin\Events\ModuleDeactivated;

class InvalidateModuleCache
{
    /**
     * Create the event listener.
     */
    public function __construct(
        private ModuleCacheService $cache
    ) {}

    /**
     * Handle the event.
     *
     * Invalide le cache du tenant concerné lorsqu'un module est activé ou désactivé
     */
    public function handle(ModuleActivated|ModuleDeactivated $event): void
    {
        // Invalider le cache du tenant concerné
        $this->cache->forgetTenant($event->siteModule->site_id);

        // Invalider aussi le cache global des dépendances
        // car l'activation/désactivation peut affecter les relations
        $this->cache->forgetDependencies();
    }
}
