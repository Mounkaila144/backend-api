<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantModuleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $tenantStatus = $this['tenant_status'];

        // Version du module (depuis module.json)
        $moduleVersion = $this['version'];

        // Version installée (depuis t_site_modules.installed_version)
        $installedVersion = $tenantStatus['installed_version'] ?? null;

        return [
            'name' => $this['name'],
            'alias' => $this['alias'],
            'description' => $this['description'],
            'version' => $moduleVersion,
            'installedVersion' => $installedVersion,
            'dependencies' => $this['dependencies'],
            'isSystem' => $this['is_system'],
            'status' => $tenantStatus ? ($tenantStatus['is_active'] ? 'active' : 'inactive') : 'not_installed',
            'installedAt' => $tenantStatus['installed_at'] ?? null,
            'uninstalledAt' => $tenantStatus['uninstalled_at'] ?? null,
            'config' => $tenantStatus['config'] ?? null,
            'versionHistory' => $tenantStatus['version_history'] ?? null,
        ];
    }
}
