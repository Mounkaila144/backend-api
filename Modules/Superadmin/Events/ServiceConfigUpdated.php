<?php

namespace Modules\Superadmin\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Superadmin\Entities\ServiceConfig;

class ServiceConfigUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public ServiceConfig $serviceConfig,
        public int $userId,
        public array $updatedFields
    ) {
    }
}
