<?php

namespace Modules\Superadmin\Services;

use App\Models\Tenant;
use Modules\Superadmin\Entities\SiteModule;

interface ModuleInstallerInterface
{
    /**
     * Active un module pour un tenant
     *
     * @return array{siteModule: SiteModule, result: \Modules\Superadmin\Services\SagaResult}
     */
    public function activate(Tenant $tenant, string $moduleName, array $config = []): array;

    /**
     * Active plusieurs modules pour un tenant
     */
    public function activateBatch(Tenant $tenant, array $moduleNames, array $configs = []): \Modules\Superadmin\Services\BatchResult;

    /**
     * Désactive un module pour un tenant
     */
    public function deactivate(Tenant $tenant, string $moduleName, array $options = []): SiteModule;
}
