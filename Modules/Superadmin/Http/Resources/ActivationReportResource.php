<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivationReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'module' => [
                'name' => $this['module_name'],
                'tenantId' => $this['tenant_id'],
            ],
            'activation' => [
                'success' => $this['success'],
                'completedSteps' => $this['completed_steps'],
                'durationMs' => $this['duration_ms'],
            ],
            'details' => [
                'migrationsRun' => $this['migrations_count'] ?? 0,
                'filesCreated' => $this['files_created'] ?? [],
                'configGenerated' => $this['config_generated'] ?? false,
                'stepDetails' => $this['step_details'] ?? [],
            ],
            'installedAt' => $this['installed_at'],
        ];
    }
}
