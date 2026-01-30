<?php

namespace Modules\Superadmin\Listeners;

use Modules\Superadmin\Events\ModuleActivated;
use Modules\Superadmin\Events\ModuleDeactivated;
use Modules\Superadmin\Events\ModuleActivationFailed;
use Illuminate\Support\Facades\Log;

class LogModuleActivation
{
    /**
     * Log successful module activation
     */
    public function handleActivated(ModuleActivated $event): void
    {
        Log::channel('superadmin')->info("Module activated", [
            'action' => 'module.activated',
            'module' => $event->siteModule->module_name,
            'tenant_id' => $event->siteModule->site_id,
            'site_module_id' => $event->siteModule->id,
        ]);
    }

    /**
     * Log module deactivation
     */
    public function handleDeactivated(ModuleDeactivated $event): void
    {
        Log::channel('superadmin')->info("Module deactivated", [
            'action' => 'module.deactivated',
            'module' => $event->siteModule->module_name,
            'tenant_id' => $event->siteModule->site_id,
            'site_module_id' => $event->siteModule->id,
        ]);
    }

    /**
     * Log failed module activation with rollback info
     */
    public function handleFailed(ModuleActivationFailed $event): void
    {
        Log::channel('superadmin')->error("Module activation failed", [
            'action' => 'module.activation_failed',
            'module' => $event->moduleName,
            'tenant_id' => $event->siteId,
            'error' => $event->errorMessage,
            'completed_steps' => $event->completedSteps,
        ]);
    }
}
