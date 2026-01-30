<?php

namespace Modules\Superadmin\Events;

use Modules\Superadmin\Entities\SiteModule;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ModuleActivated
{
    use Dispatchable, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public SiteModule $siteModule
    ) {}
}
