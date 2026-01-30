<?php

namespace Modules\Superadmin\Listeners;

use Modules\Superadmin\Events\ServiceConfigUpdated;
use Illuminate\Support\Facades\Log;

class LogServiceConfigUpdate
{
    public function handle(ServiceConfigUpdated $event): void
    {
        Log::channel('superadmin')->info("Service configuration updated", [
            'action' => 'service.config.updated',
            'service' => $event->serviceConfig->service_name,
            'changed_fields' => $event->updatedFields,
            'user_id' => $event->userId,
            'config_id' => $event->serviceConfig->id ?? null,
        ]);
    }
}
