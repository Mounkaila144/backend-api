<?php

namespace Modules\Site\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource simplifiée pour les listes de sites
 */
class SiteListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->site_id,
            'host' => $this->site_host,
            'db_name' => $this->site_db_name,
            'type' => $this->site_type,
            'available' => $this->site_available === 'YES',
            'is_customer' => $this->is_customer === 'YES',
            'company' => $this->site_company,
            'is_uptodate' => $this->is_uptodate === 'YES',
            'admin_available' => $this->site_admin_available === 'YES',
            'frontend_available' => $this->site_frontend_available === 'YES',
            'last_connection' => $this->last_connection?->toIso8601String(),
        ];
    }
}
