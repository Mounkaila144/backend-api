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
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'company' => $this->customer->company,
                    'gender' => $this->customer->gender,
                    'firstname' => $this->customer->firstname,
                    'lastname' => $this->customer->lastname,
                    'email' => $this->customer->email,
                    'phone' => $this->customer->phone,
                    'mobile' => $this->customer->mobile,
                    'mobile2' => $this->customer->mobile2,
                    'phone1' => $this->customer->phone1,
                    'birthday' => $this->customer->birthday?->format('Y-m-d'),
                    'union_id' => $this->customer->union_id,
                    'age' => $this->customer->age,
                    'salary' => $this->customer->salary,
                    'occupation' => $this->customer->occupation,
                    'status' => $this->customer->status,
                    'created_at' => $this->customer->created_at?->format('Y-m-d\TH:i:s.u\Z'),
                    'updated_at' => $this->customer->updated_at?->format('Y-m-d\TH:i:s.u\Z'),
                    'full_name' => $this->customer->full_name,
                    'display_name' => $this->customer->display_name,
                    'addresses' => $this->customer->relationLoaded('addresses')
                        ? $this->customer->addresses->map(function ($address) {
                            return [
                                'id' => $address->id,
                                'address1' => $address->address1,
                                'address2' => $address->address2,
                                'postcode' => $address->postcode,
                                'city' => $address->city,
                                'state' => $address->state,
                                'country' => $address->country,
                                'coordinates' => $address->coordinates,
                                'lat' => $address->lat,
                                'lng' => $address->lng,
                                'status' => $address->status,
                                'full_address' => $address->full_address,
                            ];
                        })
                        : [],
                ];
            }),

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
            'quoted_at' => $this->quoted_at?->format('Y-m-d'),
            'billing_at' => $this->billing_at?->format('Y-m-d'),
            'opened_at' => $this->opened_at?->format('Y-m-d'),
            'opened_at_range_id' => $this->opened_at_range_id,
            'sent_at' => $this->sent_at?->format('Y-m-d H:i:s'),
            'payment_at' => $this->payment_at?->format('Y-m-d'),
            'opc_at' => $this->opc_at?->format('Y-m-d H:i:s'),
            'opc_range_id' => $this->opc_range_id,
            'sav_at_range_id' => $this->sav_at_range_id,
            'apf_at' => $this->apf_at?->format('Y-m-d'),

            // Status
            'state_id' => $this->state_id,
            'contract_status' => $this->whenLoaded('contractStatus', function () {
                return [
                    'id' => $this->contractStatus->id,
                    'name' => $this->contractStatus->name,
                    'color' => $this->contractStatus->color,
                    'icon' => $this->contractStatus->icon,
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
            'mensuality' => (float) $this->mensuality,
            'advance_payment' => (float) $this->advance_payment,
            'company_id' => $this->company_id,

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
                        'product' => $product->relationLoaded('product') ? $product->product : null,
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
                        'user' => $c->relationLoaded('user') ? $c->user : null,
                    ];
                });
            }),

            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
