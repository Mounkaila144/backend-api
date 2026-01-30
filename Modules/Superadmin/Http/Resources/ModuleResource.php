<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this['name'],
            'alias' => $this['alias'],
            'description' => $this['description'],
            'version' => $this['version'],
            'dependencies' => $this['dependencies'],
            'priority' => $this['priority'],
            'isSystem' => $this['is_system'],
            'isEnabled' => $this['enabled'],
        ];
    }
}
