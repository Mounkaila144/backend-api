<?php

namespace Modules\CustomersContracts\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Contract List Resource - Optimized for table/list display
 *
 * Returns columns conditionally based on user permissions,
 * matching the Symfony template per-column hasCredential() checks:
 * customers_contracts_ajaxListPartialContract.tpl
 */
class ContractListResource extends JsonResource
{
    /** ses champs sont des chec
     * Permission key → Symfony credential name
     * Maps each field group to the credential required to view it.
     */
    public const FIELD_PERMISSIONS = [
        'id'                => 'contract_view_list_id',
        'customer'          => 'contract_list_view_sale2',
        'customer_phone'    => 'contract_list_view_phone',
        'customer_postcode' => 'contract_list_view_postcode',
        'customer_city'     => 'contract_list_view_city',
        'opened_at'         => 'contract_list_opened_at',
        'opc_at'            => 'contract_list_opc_at',
        'sav_at'            => 'contract_list_view_sav_at',
        'apf_at'            => 'contract_list_apf_at',
        'payment_at'        => 'contract_list_payment_at',
        'closed_at'         => 'contract_list_closed_at',
        'pre_meeting_at'    => 'contract_list_view_pre_meeting_at',
        'telepro'           => 'contract_list_view_telepro',
        'sale1'             => 'contract_list_view_sale1',
        'sale2'             => 'contract_list_view_sale2',
        'assistant'         => 'contract_list_view_assistant',
        'team'              => 'contract_view_list_team',
        'financial_partner' => 'contract_view_list_partner',
        'partner_layer'     => 'contract_view_list_partner_layer',
        'polluter'          => 'contract_view_list_polluter',
        'company'           => 'contract_list_company',
        'campaign'          => 'contract_list_campaign',
        'creator'           => 'contract_list_created_by',
        'contributor'       => 'contract_list_attributions',
        'contract_status'   => 'contract_list_view_state',
        'install_status'    => 'contract_list_view_install_state',
        'admin_status'      => 'contract_view_list_admin_status',
        'opc_status'        => 'contract_view_list_opc_status',
        'time_status'       => 'contract_view_list_time_state',
        'is_confirmed'      => 'contract_view_list_confirmed',
        'is_hold'           => 'contract_view_list_hold',
        'is_hold_quote'     => 'contract_view_list_hold_quote',
        'is_document'       => 'contract_list_change_is_document',
        'is_photo'          => 'contract_list_change_is_photo',
        'is_quality'        => 'contract_list_change_is_quality',
        'status'            => 'contract_list_view_status',
        'surface_top'       => 'app_domoprime_iso_contract_list_surface_101',
        'surface_wall'      => 'app_domoprime_iso_contract_list_surface_102',
        'surface_floor'     => 'app_domoprime_iso_contract_list_surface_103',
        'surface_parcel'    => 'app_domoprime_iso_contract_list_surface_parcel',
        'pricing'           => 'contract_list_pricing',
        'class_energy'      => 'contract_list_calculation_class_pager',
    ];

    /**
     * Permitted field keys for the current request.
     * Set once per request, shared across all resource instances.
     *
     * @var array<string, true>  Indexed for O(1) lookup
     */
    protected static array $permittedFields = [];

    /**
     * Set the permitted fields for all resource instances in this request.
     */
    public static function setPermittedFields(array $fields): void
    {
        static::$permittedFields = array_flip($fields);
    }

    /**
     * Resolve which field keys the user is allowed to see.
     * Superadmins get all keys. Other users are checked per credential.
     *
     * @return string[]  List of permitted field keys
     */
    public static function resolvePermittedFields($user): array
    {
        // Superadmin bypass — all fields permitted
        if ($user->isSuperadmin()) {
            return array_keys(self::FIELD_PERMISSIONS);
        }

        $permitted = [];
        foreach (self::FIELD_PERMISSIONS as $key => $credential) {
            if ($user->hasCredential($credential)) {
                $permitted[] = $key;
            }
        }

        return $permitted;
    }

    /**
     * Check if a field key is permitted for the current user.
     */
    protected static function can(string $fieldKey): bool
    {
        // If permittedFields was never set, allow everything (backward compat)
        if (empty(static::$permittedFields)) {
            return true;
        }

        return isset(static::$permittedFields[$fieldKey]);
    }

    public function toArray($request): array
    {
        $data = [
            'reference' => $this->reference,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'signed_at' => $this->signed_at?->format('Y-m-d'),
            'sent_at' => $this->sent_at?->format('Y-m-d H:i:s'),
            'total_price_with_taxe' => (float) $this->total_price_with_taxe,
            'total_price_without_taxe' => (float) $this->total_price_without_taxe,
            'mensuality' => (float) $this->mensuality,
            'advance_payment' => (float) $this->advance_payment,
            'tax_id' => $this->tax_id,
            'tax' => $this->formatRelation('tax', fn ($t) => ['id' => $t->id, 'rate' => $t->rate]),
            'products' => $this->when(
                $this->relationLoaded('products') && $this->products->isNotEmpty(),
                fn () => $this->products->map(fn ($p) => [
                    'id' => $p->id,
                    'product_id' => $p->product_id,
                    'meta_title' => $p->meta_title ?? null,
                ])->toArray()
            ),
            'remarks' => $this->remarks,
            'is_billable' => $this->is_billable,
            'is_signed' => $this->is_signed,
            'installer_user_id' => $this->installer_user_id,
            'installer_user' => $this->formatUserRelation('installerUser'),
            // Surface home is always visible (no credential check in Symfony template)
            'surface_home' => $this->getVariableValue('surface_home'),
        ];

        // Permission-gated ID (Symfony: contract_view_list_id)
        if (static::can('id')) {
            $data['id'] = $this->id;
        } else {
            $data['id'] = $this->id; // ID always needed for row key, but formatted display is gated
        }

        // Permission-gated dates
        $gatedDates = [
            'opened_at' => 'Y-m-d', 'opc_at' => 'Y-m-d H:i:s', 'sav_at' => 'Y-m-d H:i:s',
            'apf_at' => 'Y-m-d', 'payment_at' => 'Y-m-d', 'closed_at' => 'Y-m-d H:i:s',
            'pre_meeting_at' => 'Y-m-d H:i:s',
        ];
        foreach ($gatedDates as $field => $format) {
            if (static::can($field)) {
                $data[$field] = $this->$field?->format($format);
            }
        }

        // Permission-gated customer
        if (static::can('customer') && $this->relationLoaded('customer') && $this->customer) {
            $data['customer'] = $this->formatCustomer();
        }

        // Permission-gated users
        foreach (['telepro' => 'telepro_id', 'sale1' => 'sale_1_id', 'sale2' => 'sale_2_id', 'assistant' => 'assistant_id'] as $permKey => $fk) {
            if (static::can($permKey)) {
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatUserRelation($permKey);
            }
        }

        // Permission-gated creator (Symfony: contract_list_created_by)
        if (static::can('creator')) {
            $data['created_by_id'] = $this->created_by_id;
            $data['creator'] = $this->formatUserRelation('creator');
        }

        // Permission-gated named relations (team + partners)
        foreach (['team' => 'team_id', 'financial_partner' => 'financial_partner_id', 'partner_layer' => 'partner_layer_id', 'polluter' => 'polluter_id', 'company' => 'company_id'] as $permKey => $fk) {
            if (static::can($permKey)) {
                $relation = lcfirst(str_replace('_', '', ucwords($permKey, '_')));
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatRelation($relation, fn ($r) => [
                    'id' => $r->id,
                    'name' => $permKey === 'company' ? $r->name : mb_strtoupper($r->name),
                ]);
            }
        }

        // Permission-gated campaign (Symfony: contract_list_campaign)
        if (static::can('campaign')) {
            $data['campaign_id'] = $this->campaign_id;
            $data['campaign'] = $this->formatRelation('campaign', fn ($c) => [
                'id' => $c->id,
                'name' => $c->name ?? $c->title ?? (string) $c->id,
            ]);
        }

        // Permission-gated contributors (Symfony: contract_list_attributions)
        if (static::can('contributor')) {
            $data['contributors'] = $this->when(
                $this->relationLoaded('contributors') && $this->contributors->isNotEmpty(),
                fn () => $this->contributors->map(fn ($c) => [
                    'id' => $c->id,
                    'type' => $c->type,
                    'user_id' => $c->user_id,
                    'user' => $c->relationLoaded('user') && $c->user
                        ? ['id' => $c->user->id, 'name' => mb_strtoupper(trim($c->user->lastname . ' ' . $c->user->firstname))]
                        : null,
                ])->toArray()
            );
        }

        // Permission-gated statuses
        $statuses = [
            'contract_status' => ['contractStatus', 'state_id'],
            'install_status'  => ['installStatus', 'install_state_id'],
            'admin_status'    => ['adminStatus', 'admin_status_id'],
            'opc_status'      => ['opcStatus', 'opc_status_id'],
            'time_status'     => ['timeStatus', 'time_state_id'],
        ];
        foreach ($statuses as $permKey => [$relation, $fk]) {
            if (static::can($permKey)) {
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatStatusRelation($relation);
            }
        }

        // Permission-gated boolean flags
        $gatedFlags = ['is_confirmed', 'is_hold_quote', 'is_document', 'is_photo', 'is_quality', 'status'];
        foreach ($gatedFlags as $flag) {
            if (static::can($flag)) {
                $data[$flag] = $this->$flag;
            }
        }
        if (static::can('is_hold')) {
            $data['is_hold'] = $this->is_hold;
            $data['is_hold_admin'] = $this->is_hold_admin;
        }

        // Permission-gated domoprime surfaces (from variables JSON or related tables)
        foreach (['surface_top', 'surface_wall', 'surface_floor', 'surface_parcel'] as $surfaceKey) {
            if (static::can($surfaceKey)) {
                $data[$surfaceKey] = $this->getVariableValue($surfaceKey);
            }
        }

        // Permission-gated pricing (domoprime)
        if (static::can('pricing')) {
            $data['pricing'] = $this->getVariableValue('pricing');
        }

        // Permission-gated energy class (domoprime)
        if (static::can('class_energy')) {
            $data['class_energy'] = $this->getVariableValue('class_energy');
        }

        return $data;
    }

    /**
     * Get a value from the variables JSON field.
     * Used for domoprime plugin data (surfaces, pricing, class).
     */
    protected function getVariableValue(string $key): mixed
    {
        $variables = $this->variables ? json_decode($this->variables, true) : [];

        return $variables[$key] ?? null;
    }

    protected function formatUserRelation(string $relation): mixed
    {
        return $this->formatRelation($relation, fn ($u) => [
            'id' => $u->id,
            'name' => mb_strtoupper(trim($u->lastname . ' ' . $u->firstname)),
        ]);
    }

    protected function formatRelation(string $relation, \Closure $transform): mixed
    {
        return $this->when(
            $this->relationLoaded($relation) && $this->$relation,
            fn () => $transform($this->$relation)
        );
    }

    protected function formatStatusRelation(string $relation): mixed
    {
        return $this->when(
            $this->relationLoaded($relation) && $this->$relation,
            function () use ($relation) {
                $status = $this->$relation;
                $translation = $status->relationLoaded('translations')
                    ? $status->translations->first()
                    : null;

                return [
                    'id' => $status->id,
                    'name' => $status->name,
                    'color' => $status->color,
                    'icon' => $status->icon,
                    'value' => $translation?->value ?? $status->name,
                ];
            }
        );
    }

    protected function formatCustomer(): array
    {
        $customer = [
            'id' => $this->customer->id,
            'lastname' => $this->customer->lastname,
            'firstname' => $this->customer->firstname,
            'company' => $this->customer->company,
            'email' => $this->customer->email,
        ];

        if (static::can('customer_phone')) {
            $customer['phone'] = $this->customer->phone;
            $customer['mobile'] = $this->customer->mobile;
        }

        if ($this->customer->relationLoaded('addresses') && $this->customer->addresses->isNotEmpty()) {
            $addr = $this->customer->addresses->first();
            $address = ['id' => $addr->id, 'address1' => $addr->address1, 'address2' => $addr->address2, 'country' => $addr->country];
            if (static::can('customer_postcode')) {
                $address['postcode'] = $addr->postcode;
            }
            if (static::can('customer_city')) {
                $address['city'] = $addr->city;
            }
            $customer['address'] = $address;
        }

        return $customer;
    }
}
