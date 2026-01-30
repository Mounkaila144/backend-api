<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * Transform the activity log entry into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->properties['action'] ?? 'unknown',
            'description' => $this->description,
            'tenantId' => $this->properties['tenant_id'] ?? null,
            'module' => $this->properties['module'] ?? null,
            'causedBy' => $this->causer_id,
            'error' => $this->properties['error'] ?? null,
            'completedSteps' => $this->properties['completed_steps'] ?? [],
            'metadata' => $this->properties['metadata'] ?? [],
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
