<?php

namespace Modules\Superadmin\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ModuleActivationFailed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public int $tenantId,
        public string $moduleName,
        public string $errorMessage,
        public array $completedSteps,
        public int $userId
    ) {}
}
