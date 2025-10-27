<?php

namespace Modules\CustomersContracts\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Contract API Resource
 */
class ContractResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,

            // Customer
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer'),

            // Related IDs
            'meeting_id' => $this->meeting_id,
            'financial_partner_id' => $this->financial_partner_id,
            'tax_id' => $this->tax_id,

            // Team members
            'team_id' => $this->team_id,
            'telepro_id' => $this->telepro_id,
            'sale_1_id' => $this->sale_1_id,
            'sale_2_id' => $this->sale_2_id,
            'manager_id' => $this->manager_id,
            'assistant_id' => $this->assistant_id,
            'installer_user_id' => $this->installer_user_id,

            // Dates
            'opened_at' => $this->opened_at?->format('Y-m-d'),
            'opened_at_range_id' => $this->opened_at_range_id,
            'sent_at' => $this->sent_at?->format('Y-m-d H:i:s'),
            'payment_at' => $this->payment_at?->format('Y-m-d'),
            'opc_at' => $this->opc_at?->format('Y-m-d H:i:s'),
            'opc_range_id' => $this->opc_range_id,
            'apf_at' => $this->apf_at?->format('Y-m-d'),

            // Status
            'state_id' => $this->state_id,
            'status' => $this->whenLoaded('status', function () {
                return [
                    'id' => $this->status->id,
                    'name' => $this->status->name,
                    'color' => $this->status->color,
                    'icon' => $this->status->icon,
                ];
            }),

            'install_state_id' => $this->install_state_id,
            'install_status' => $this->whenLoaded('installStatus', function () {
                return $this->installStatus ? [
                    'id' => $this->installStatus->id,
                    'name' => $this->installStatus->name,
                    'color' => $this->installStatus->color,
                    'icon' => $this->installStatus->icon,
                ] : null;
            }),

            'admin_status_id' => $this->admin_status_id,
            'admin_status' => $this->whenLoaded('adminStatus', function () {
                return $this->adminStatus ? [
                    'id' => $this->adminStatus->id,
                    'name' => $this->adminStatus->name,
                    'color' => $this->adminStatus->color,
                    'icon' => $this->adminStatus->icon,
                ] : null;
            }),

            // Financial
            'total_price_with_taxe' => (float) $this->total_price_with_taxe,
            'total_price_without_taxe' => (float) $this->total_price_without_taxe,

            // Additional info
            'remarks' => $this->remarks,
            'variables' => $this->variables_array ?? json_decode($this->variables, true),
            'is_signed' => $this->is_signed,
            'status_flag' => $this->getAttribute('status'), // ACTIVE or DELETE

            // Products
            'products' => $this->whenLoaded('products', function () {
                return $this->products->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'product_id' => $product->product_id,
                        'details' => $product->details,
                        'product' => $product->whenLoaded('product'),
                    ];
                });
            }),

            // History
            'history' => $this->whenLoaded('history', function () {
                return $this->history->map(function ($h) {
                    return [
                        'id' => $h->id,
                        'user_id' => $h->user_id,
                        'user_application' => $h->user_application,
                        'history' => $h->history,
                        'created_at' => $h->created_at->format('Y-m-d H:i:s'),
                    ];
                });
            }),

            // Contributors
            'contributors' => $this->whenLoaded('contributors', function () {
                return $this->contributors->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'type' => $c->type,
                        'user_id' => $c->user_id,
                        'attribution_id' => $c->attribution_id,
                        'user' => $c->whenLoaded('user'),
                    ];
                });
            }),

            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
