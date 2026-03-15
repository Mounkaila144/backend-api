<?php

namespace Modules\CustomersMeetings\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MeetingResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'registration' => $this->registration,

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
                    'status' => $this->customer->status,
                    'addresses' => $this->customer->relationLoaded('addresses')
                        ? $this->customer->addresses->map(fn ($address) => [
                            'id' => $address->id,
                            'address1' => $address->address1,
                            'address2' => $address->address2,
                            'postcode' => $address->postcode,
                            'city' => $address->city,
                            'state' => $address->state,
                            'country' => $address->country,
                            'coordinates' => $address->coordinates,
                            'status' => $address->status,
                        ])
                        : [],
                ];
            }),

            // Team members
            'telepro_id' => $this->telepro_id,
            'sales_id' => $this->sales_id,
            'sale2_id' => $this->sale2_id,
            'assistant_id' => $this->assistant_id,
            'created_by_id' => $this->created_by_id,
            'confirmed_by_id' => $this->confirmed_by_id,
            'confirmator_id' => $this->confirmator_id,
            'lock_user_id' => $this->lock_user_id,

            // Relations: Users
            'telepro' => $this->formatUser('telepro'),
            'sales' => $this->formatUser('sales'),
            'sale2' => $this->formatUser('sale2'),
            'assistant' => $this->formatUser('assistant'),
            'creator' => $this->formatUser('creator'),
            'confirmed_by' => $this->formatUser('confirmedBy'),
            'confirmator' => $this->formatUser('confirmator'),
            'lock_user' => $this->formatUser('lockUser'),

            // Dates
            'in_at' => $this->in_at?->format('Y-m-d H:i:s'),
            'in_at_range_id' => $this->in_at_range_id,
            'out_at' => $this->out_at?->format('Y-m-d H:i:s'),
            'callback_at' => $this->callback_at?->format('Y-m-d H:i:s'),
            'is_callback_cancelled' => $this->is_callback_cancelled,
            'callback_cancel_at' => $this->callback_cancel_at?->format('Y-m-d H:i:s'),
            'creation_at' => $this->creation_at?->format('Y-m-d H:i:s'),
            'treated_at' => $this->treated_at?->format('Y-m-d H:i:s'),
            'confirmed_at' => $this->confirmed_at?->format('Y-m-d H:i:s'),
            'state_updated_at' => $this->state_updated_at?->format('Y-m-d H:i:s'),
            'opc_at' => $this->opc_at?->format('Y-m-d H:i:s'),
            'lock_time' => $this->lock_time?->format('Y-m-d H:i:s'),

            // Status
            'state_id' => $this->state_id,
            'meeting_status' => $this->formatStatus('meetingStatus'),
            'status_call_id' => $this->status_call_id,
            'status_call' => $this->formatStatus('statusCall'),
            'status_lead_id' => $this->status_lead_id,
            'status_lead' => $this->formatStatus('statusLead'),

            // Type & Campaign
            'type_id' => $this->type_id,
            'meeting_type' => $this->formatStatus('meetingType'),
            'campaign_id' => $this->campaign_id,
            'campaign' => $this->whenLoaded('campaign', fn () => $this->campaign ? [
                'id' => $this->campaign->id,
                'name' => $this->campaign->name,
            ] : null),

            // Callcenter
            'callcenter_id' => $this->callcenter_id,
            'callcenter' => $this->whenLoaded('callcenter', fn () => $this->callcenter ? [
                'id' => $this->callcenter->id,
                'name' => $this->callcenter->name ?? null,
            ] : null),

            // Partners
            'polluter_id' => $this->polluter_id,
            'polluter' => $this->whenLoaded('polluter', fn () => $this->polluter ? [
                'id' => $this->polluter->id,
                'name' => $this->polluter->name,
                'commercial' => $this->polluter->commercial,
                'type' => $this->polluter->type,
            ] : null),
            'partner_layer_id' => $this->partner_layer_id,
            'partner_layer' => $this->whenLoaded('partnerLayer', fn () => $this->partnerLayer ? [
                'id' => $this->partnerLayer->id,
                'name' => $this->partnerLayer->name,
            ] : null),

            // Company
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', fn () => $this->company ? [
                'id' => $this->company->id,
                'name' => $this->company->name,
            ] : null),

            // Range
            'opc_range_id' => $this->opc_range_id,
            'opc_range' => $this->whenLoaded('opcRange', fn () => $this->opcRange ? [
                'id' => $this->opcRange->id,
                'name' => $this->opcRange->name,
                'color' => $this->opcRange->color ?? null,
                'from' => $this->opcRange->from,
                'to' => $this->opcRange->to,
            ] : null),
            'in_at_range_id' => $this->in_at_range_id,
            'in_at_range' => $this->whenLoaded('inAtRange', fn () => $this->inAtRange ? [
                'id' => $this->inAtRange->id,
                'name' => $this->inAtRange->name,
                'color' => $this->inAtRange->color ?? null,
            ] : null),

            // Financial
            'turnover' => (float) $this->turnover,

            // Flags
            'is_confirmed' => $this->is_confirmed,
            'is_hold' => $this->is_hold,
            'is_hold_quote' => $this->is_hold_quote,
            'is_qualified' => $this->is_qualified,
            'is_works_hold' => $this->is_works_hold,
            'is_locked' => $this->is_locked,
            'status_flag' => $this->getAttribute('status'),

            // Text fields
            'remarks' => $this->remarks,
            'sale_comments' => $this->sale_comments,
            'variables' => $this->variables_array ?? json_decode($this->variables, true),

            // Products
            'products' => $this->whenLoaded('products', fn () => $this->products->map(fn ($p) => [
                'id' => $p->id,
                'product_id' => $p->product_id,
                'details' => $p->details,
                'status' => $p->status,
                'product' => $p->relationLoaded('product') ? $p->product : null,
            ])),

            // Comments
            'comments' => $this->whenLoaded('comments', fn () => $this->comments
                ->where('status', 'ACTIVE')
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'comment' => $c->comment,
                    'type' => $c->type,
                    'created_at' => $c->created_at?->format('Y-m-d H:i:s'),
                ])->values()),

            // History
            'history' => $this->whenLoaded('history', fn () => $this->history->map(fn ($h) => [
                'id' => $h->id,
                'user_id' => $h->user_id,
                'old_status_id' => $h->old_status_id,
                'new_status_id' => $h->new_status_id,
                'comment' => $h->comment,
                'created_at' => $h->created_at->format('Y-m-d H:i:s'),
            ])),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    protected function formatStatus(string $relation): mixed
    {
        return $this->whenLoaded($relation, fn () => $this->$relation ? [
            'id' => $this->$relation->id,
            'name' => $this->$relation->name,
            'color' => $this->$relation->color ?? null,
            'icon' => $this->$relation->icon ?? null,
        ] : null);
    }

    protected function formatUser(string $relation): mixed
    {
        return $this->whenLoaded($relation, fn () => $this->$relation ? [
            'id' => $this->$relation->id,
            'firstname' => $this->$relation->firstname,
            'lastname' => $this->$relation->lastname,
        ] : null);
    }
}
