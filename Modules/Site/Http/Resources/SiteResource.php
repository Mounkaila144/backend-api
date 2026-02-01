<?php

namespace Modules\Site\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource pour formater les données d'un site
 */
class SiteResource extends JsonResource
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
            'database' => [
                'name' => $this->site_db_name,
                'host' => $this->site_db_host,
                'port' => $this->site_db_port ?? 3306,
                'login' => $this->site_db_login,
                // Ne pas renvoyer le mot de passe réel pour des raisons de sécurité
                // Renvoyer un indicateur pour savoir si un mot de passe est défini
                'has_password' => !empty($this->site_db_password),
                'size' => $this->site_db_size,
                'ssl' => [
                    'enabled' => $this->site_db_ssl_enabled === 'YES',
                    'mode' => $this->site_db_ssl_mode ?? 'PREFERRED',
                    'ca' => $this->site_db_ssl_ca,
                ],
            ],
            'themes' => [
                'admin' => [
                    'current' => $this->site_admin_theme,
                    'base' => $this->site_admin_theme_base,
                ],
                'frontend' => [
                    'current' => $this->site_frontend_theme,
                    'base' => $this->site_frontend_theme_base,
                ],
            ],
            'availability' => [
                'site' => $this->site_available === 'YES',
                'admin' => $this->site_admin_available === 'YES',
                'frontend' => $this->site_frontend_available === 'YES',
            ],
            'type' => $this->site_type,
            'master' => $this->site_master,
            'access_restricted' => $this->site_access_restricted === 'YES',
            'is_customer' => $this->is_customer === 'YES',
            'company' => $this->site_company,
            'is_uptodate' => $this->is_uptodate === 'YES',
            'assets' => [
                'logo' => $this->logo,
                'picture' => $this->picture,
                'banner' => $this->banner,
                'favicon' => $this->favicon,
            ],
            'size' => $this->site_size,
            'price' => $this->price,
            'last_connection' => $this->last_connection?->toIso8601String(),
        ];
    }
}
