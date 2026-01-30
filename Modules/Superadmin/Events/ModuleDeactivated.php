<?php

namespace Modules\Superadmin\Events;

use Modules\Superadmin\Entities\SiteModule;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ModuleDeactivated
{
    use Dispatchable, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public SiteModule $siteModule,
        public int $userId = 0,
        public array $metadata = []
    ) {}
}
