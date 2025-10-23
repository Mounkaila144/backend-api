<?php

namespace Modules\UsersGuard\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'application' => $this->application,
            'is_active' => (bool) $this->is_active,

            // Relations conditionnelles
            'permissions' => PermissionResource::collection($this->whenLoaded('permissions')),
            'users_count' => $this->when(
                $this->relationLoaded('users'),
                fn() => $this->users->count()
            ),

            // Info tenant (si disponible)
            'tenant' => $this->when(
                tenancy()->initialized,
                fn() => [
                    'id' => tenancy()->tenant->site_id,
                    'host' => tenancy()->tenant->site_host,
                ]
            ),
        ];
    }
}
