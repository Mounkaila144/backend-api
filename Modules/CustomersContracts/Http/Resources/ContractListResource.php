<?php

namespace Modules\CustomersContracts\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\CustomersContracts\Services\ContractSettingsService;

/**
 * Contract List Resource - Optimized for table/list display
 *
 * Returns columns conditionally based on user permissions,
 * matching the Symfony template per-column hasCredential() checks:
 * customers_contracts_ajaxListPartialContract.tpl
 */
class ContractListResource extends JsonResource
{
    /**
     * Permission key → credential(s) required to see the data.
     *
     * String value = single credential check.
     * Array value  = OR logic (user needs ANY ONE of the listed credentials).
     *
     * Matches the Symfony template pattern:
     *   {if $item->isAuthorized() || $user->hasCredential([['cred1','cred2',...]])}
     */
    public const FIELD_PERMISSIONS = [
        'id'                => 'contract_view_list_id',
        'customer'          => 'contract_list_view_lastname',       // tpl:929
        'customer_phone'    => 'contract_list_view_phone',          // tpl:998
        'customer_postcode' => 'contract_list_view_postcode',       // tpl:1020
        'customer_city'     => 'contract_list_view_city',           // tpl:1029
        'opened_at'         => 'contract_list_opened_at',           // tpl:846
        'opc_at'            => 'contract_list_opc_at',              // tpl:850
        'sav_at'            => 'contract_list_view_sav_at',         // tpl:898
        'apf_at'            => 'contract_list_apf_at',              // tpl:888
        'payment_at'        => 'contract_list_payment_at',          // tpl:893
        'closed_at'         => 'contract_list_closed_at',           // tpl:920
        'pre_meeting_at'    => 'contract_list_view_pre_meeting_at', // tpl:873
        'telepro'           => 'contract_list_view_telepro',        // tpl:1211
        'sale1'             => 'contract_list_view_sale1',          // tpl:1165
        'sale2'             => 'contract_list_view_sale2',          // tpl:1188
        'assistant'         => 'contract_list_view_assistant',      // tpl:1227
        'team'              => 'contract_list_view_team',           // tpl:1342
        'financial_partner' => 'contract_list_view_partner',        // tpl:1241
        'partner_layer'     => 'contract_list_view_partner_layer',  // tpl:1255
        'polluter'          => 'contract_list_view_polluter',       // tpl:1331
        'company'           => 'contract_list_company',             // tpl:930
        'campaign'          => 'contract_list_campaign',            // tpl:970
        'creator'           => 'contract_list_created_by',
        'contributor'       => 'contract_list_attributions',
        'contract_status'   => 'contract_list_view_state',
        'install_status'    => 'contract_list_view_install_state',
        'admin_status'      => 'contract_list_view_admin_status',   // tpl:1291
        'opc_status'        => 'contract_list_view_opc_status',     // tpl:1266
        'time_status'       => 'contract_list_view_time_state',     // tpl:1311
        'is_confirmed'      => 'contract_list_view_confirmed',      // tpl:1360
        'is_hold'           => 'contract_view_list_hold',           // tpl:1373
        'is_hold_quote'     => 'contract_view_list_hold_quote',
        'is_document'       => 'contract_list_change_is_document',
        'is_photo'          => 'contract_list_change_is_photo',
        'is_quality'        => 'contract_list_change_is_quality',
        'status'            => 'contract_list_view_status',
        // Surfaces: require explicit superadmin_debug permission (not auto-granted to superadmins)
        'surface_top'       => ['superadmin_debug'],    // tpl:139
        'surface_wall'      => ['superadmin_debug'],    // tpl:152
        'surface_floor'     => ['superadmin_debug'],    // tpl:167
        'surface_parcel'    => 'app_domoprime_iso_contract_list_surface_parcel',  // tpl:182
        'pricing'           => 'contract_list_pricing',             // tpl:1036
        'class_energy'      => 'contract_list_calculation_class_pager', // tpl:946
        'prime_renov'        => 'services_primerenov_list',             // tpl:1058
        'prime_renov_state1' => 'services_primerenov_list',             // tpl:1069
        'prime_renov_state2' => 'services_primerenov_list',             // tpl:1081
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
     * Columns always visible in the frontend regardless of credentials.
     * In Symfony, these use $formFilter->hasColumn() (always true for configured columns)
     * or have no credential gate at all. Note: some hasValidator() checks are
     * INDIRECT permission gates (the form only adds the validator if the user has
     * a specific credential) — those go in COLUMN_HEADER_PERMISSIONS instead.
     */
    public const ALWAYS_VISIBLE_COLUMNS = [
        'date',              // tpl:20  - $formFilter->hasColumn('date')
        'customer',          // tpl:29  - $formFilter->hasColumn('customer')
        'company',           // tpl:45  - $formFilter->hasColumn('company_id')
        'campaign',          // tpl:52  - $formFilter->hasColumn('campaign_id')
        'is_billable',       // tpl:59  - $formFilter->hasColumn('is_billable')
        'customer_phone',    // tpl:77  - $formFilter->hasColumn('phone')
        'customer_postcode', // tpl:87  - $formFilter->hasColumn('postcode')
        'customer_city',     // tpl:97  - $formFilter->hasColumn('city')
        'pricing',           // tpl:107 - $formFilter->hasColumn('pricing_id')
        'surface_home',      // tpl:115 - no credential
        'montant_ttc',       // tpl:374 - $formFilter->hasColumn('amount')
        'telepro',           // tpl:206 - hasValidator always true (no credential gate in form)
        'contract_status',   // tpl:346 - $formFilter->hasColumn('state')
    ];

    /**
     * Header-level credential checks that control column VISIBILITY in the frontend.
     * These match the hasCredential() checks on <th> elements in the Symfony template.
     *
     * IMPORTANT: These are DIFFERENT from FIELD_PERMISSIONS (data-level credentials).
     * Example: header uses 'contract_view_list_partner', data uses 'contract_list_view_partner'.
     *
     * Format:
     *   Nested array [['cred1','cred2']] = standard hasCredential OR check (superadmin auto-granted)
     *   Flat array ['cred1']             = explicit-only check (NO superadmin bypass)
     */
    public const COLUMN_HEADER_PERMISSIONS = [
        'id'                 => [['superadmin', 'admin', 'contract_view_list_id']],                                           // tpl:8
        'class_energy'       => [['app_domoprime_iso_contract_list_filter_header_class', 'contract_list_calculation_class_pager']], // tpl:38
        'prime_renov'        => [['superadmin', 'services_primerenov_list']],                                                  // tpl:125
        'prime_renov_state1' => [['superadmin', 'services_primerenov_list']],                                                  // tpl:130
        'prime_renov_state2' => [['superadmin', 'services_primerenov_list']],                                                  // tpl:134
        'surface_top'        => ['superadmin_debug'],                                                                          // tpl:139 - explicit only
        'surface_wall'       => ['superadmin_debug'],                                                                          // tpl:152 - explicit only
        'surface_floor'      => ['superadmin_debug'],                                                                          // tpl:167 - explicit only
        'surface_parcel'     => [['superadmin', 'app_domoprime_iso_contract_list_surface_parcel']],                             // tpl:182
        'sale1'              => [['superadmin', 'admin', 'contract_list_view_sale1']],                                          // tpl:190
        'sale2'              => [['superadmin', 'admin', 'contract_list_view_sale2']],                                          // tpl:198
        'assistant'          => [['superadmin', 'admin', 'contract_view_list_assistant', 'contract_list_display_assistant']],    // tpl:215
        'financial_partner'  => [['superadmin', 'admin', 'contract_view_list_partner']],                                        // tpl:223
        'partner_layer'      => [['superadmin', 'admin', 'contract_view_list_partner_layer']],                                  // tpl:231
        'opc_status'         => [['superadmin', 'admin', 'contract_view_list_opc_status']],                                     // tpl:243
        'admin_status'       => [['superadmin', 'admin', 'contract_view_list_admin_status']],                                   // tpl:251
        'time_status'        => [['superadmin', 'contract_view_list_time_state']],                                              // tpl:259
        'polluter'           => [['superadmin', 'admin', 'contract_view_list_polluter']],                                       // tpl:267
        'team'               => [['superadmin', 'admin', 'contract_view_list_team', 'contract_list_display_team']],             // tpl:275
        'is_confirmed'       => [['superadmin', 'contract_view_list_confirmed']],                                               // tpl:288
        'is_hold'            => [['superadmin', 'admin', 'contract_view_list_hold']],                                           // tpl:296
        'is_hold_quote'      => [['superadmin', 'contract_view_list_hold_quote']],                                              // tpl:304
        'is_document'        => [['superadmin', 'contract_list_is_document']],                                                  // form:479 - validator gate
        'is_photo'           => [['superadmin', 'contract_list_is_photo']],                                                     // form:484 - validator gate
        'is_quality'         => [['superadmin', 'contract_list_is_quality']],                                                   // form:489 - validator gate
        'creator'            => [['superadmin', 'contract_list_created_by']],                                                   // form:447 - validator gate
        'install_status'     => [['superadmin', 'contract_list_install_state']],                                                // tpl:352
        'status'             => [['superadmin', 'admin', 'contract_list_status']],                                              // tpl:360
    ];

    /**
     * Resolve which columns are VISIBLE based on header-level credentials.
     * Used to build the permitted_fields list sent to the frontend.
     */
    public static function resolveVisibleColumns($user): array
    {
        $visible = [];

        foreach (self::COLUMN_HEADER_PERMISSIONS as $key => $credentials) {
            if (isset($credentials[0]) && is_array($credentials[0])) {
                // Nested array: standard hasCredential format [['cred1', 'cred2']]
                // Superadmin auto-bypass applies (via hasCredential)
                if ($user->hasCredential($credentials)) {
                    $visible[] = $key;
                }
            } else {
                // Flat array: explicit-only credentials (NO superadmin bypass)
                // Used for superadmin_debug which must be explicitly assigned
                foreach ($credentials as $cred) {
                    if ($user->hasExplicitCredential($cred)) {
                        $visible[] = $key;
                        break;
                    }
                }
            }
        }

        return $visible;
    }

    /**
     * Resolve which field keys control data visibility (used by setPermittedFields / can()).
     * This gates what DATA is included in the JSON response.
     */
    public static function resolvePermittedFields($user): array
    {
        $isSuperadmin = $user->isSuperadmin();
        $permitted = [];

        foreach (self::FIELD_PERMISSIONS as $key => $credentials) {
            if (is_array($credentials)) {
                // Array = OR logic, checked WITHOUT superadmin bypass.
                // Credentials like superadmin_debug must be explicitly assigned,
                // even for superadmins — they are not auto-granted.
                foreach ($credentials as $cred) {
                    if ($user->hasExplicitCredential($cred)) {
                        $permitted[] = $key;
                        break;
                    }
                }
            } else {
                // Single credential: superadmin bypass applies
                if ($isSuperadmin || $user->hasCredential($credentials)) {
                    $permitted[] = $key;
                }
            }
        }

        return $permitted;
    }

    /**
     * Check if a field key is permitted for the current user (global check).
     */
    protected static function can(string $fieldKey): bool
    {
        // If permittedFields was never set, allow everything (backward compat)
        if (empty(static::$permittedFields)) {
            return true;
        }

        return isset(static::$permittedFields[$fieldKey]);
    }

    /**
     * Per-row authorization check matching Symfony isAuthorized().
     *
     * Returns true if:
     *  1. User has superadmin/admin/contract_owner credential → always authorized
     *  2. User does NOT have contract_list_owner credential → no ownership restriction
     *  3. User is the owner (sale1, sale2, telepro, assistant) of this contract
     */
    protected function isAuthorized(): bool
    {
        $user = request()->user();
        if (!$user) return false;

        // superadmin/admin/contract_owner → always authorized
        if ($user->hasCredential([['superadmin', 'admin', 'contract_owner']])) {
            return true;
        }

        // No ownership restriction if user doesn't have contract_list_owner
        if (!$user->hasCredential('contract_list_owner')) {
            return true;
        }

        // Per-row ownership check
        $userId = $user->id;
        return $this->assistant_id === $userId
            || $this->telepro_id === $userId
            || $this->sale_1_id === $userId
            || $this->sale_2_id === $userId;
    }

    /**
     * Per-row field check: authorized for this row OR has global permission.
     * Matches Symfony pattern: $item->isAuthorized() || $user->hasCredential(...)
     */
    protected function canField(string $fieldKey): bool
    {
        return $this->isAuthorized() || static::can($fieldKey);
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
            'surface_home' => $this->getDomoprimeValue('surface_home'),
        ];

        // Permission-gated ID (Symfony: contract_view_list_id)
        if ($this->canField('id')) {
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
            if ($this->canField($field)) {
                $data[$field] = $this->$field?->format($format);
            }
        }

        // Permission-gated customer
        if ($this->canField('customer') && $this->relationLoaded('customer') && $this->customer) {
            $data['customer'] = $this->formatCustomer();
        }

        // Permission-gated users
        foreach (['telepro' => 'telepro_id', 'sale1' => 'sale_1_id', 'sale2' => 'sale_2_id', 'assistant' => 'assistant_id'] as $permKey => $fk) {
            if ($this->canField($permKey)) {
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatUserRelation($permKey);
            }
        }

        // Permission-gated creator (Symfony: contract_list_created_by)
        if ($this->canField('creator')) {
            $data['created_by_id'] = $this->created_by_id;
            $data['creator'] = $this->formatUserRelation('creator');
        }

        // Permission-gated named relations (team + partners)
        foreach (['team' => 'team_id', 'financial_partner' => 'financial_partner_id', 'partner_layer' => 'partner_layer_id', 'company' => 'company_id'] as $permKey => $fk) {
            if ($this->canField($permKey)) {
                $relation = lcfirst(str_replace('_', '', ucwords($permKey, '_')));
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatRelation($relation, fn ($r) => [
                    'id' => $r->id,
                    'name' => $permKey === 'company' ? $r->name : mb_strtoupper($r->name),
                ]);
            }
        }

        // Polluter: includes commercial + type (needed for document section titles)
        if ($this->canField('polluter')) {
            $data['polluter_id'] = $this->polluter_id;
            $data['polluter'] = $this->formatRelation('polluter', fn ($r) => [
                'id' => $r->id,
                'name' => mb_strtoupper($r->name),
                'commercial' => $r->commercial,
                'type' => $r->type,
            ]);
        }

        // Permission-gated campaign (Symfony: contract_list_campaign)
        if ($this->canField('campaign')) {
            $data['campaign_id'] = $this->campaign_id;
            $data['campaign'] = $this->formatRelation('campaign', fn ($c) => [
                'id' => $c->id,
                'name' => $c->name ?? $c->title ?? (string) $c->id,
            ]);
        }

        // Permission-gated contributors (Symfony: contract_list_attributions)
        if ($this->canField('contributor')) {
            $data['contributor_summary'] = $this->when(
                $this->relationLoaded('contributors') && $this->contributors->isNotEmpty(),
                fn () => $this->contributors
                    ->filter(fn ($c) => $c->relationLoaded('user') && $c->user)
                    ->map(fn ($c) => mb_strtoupper(trim($c->user->lastname . ' ' . $c->user->firstname)))
                    ->implode(', ')
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
            if ($this->canField($permKey)) {
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatStatusRelation($relation);
            }
        }

        // Permission-gated boolean flags
        $gatedFlags = ['is_confirmed', 'is_hold_quote', 'is_document', 'is_photo', 'is_quality', 'status'];
        foreach ($gatedFlags as $flag) {
            if ($this->canField($flag)) {
                $data[$flag] = $this->$flag;
            }
        }
        if ($this->canField('is_hold')) {
            $data['is_hold'] = $this->is_hold;
            $data['is_hold_admin'] = $this->is_hold_admin;
        }

        // Permission-gated domoprime surfaces (from domoprimeIsoRequest relation)
        $surfaceMap = [
            'surface_top' => 'surface_top',
            'surface_wall' => 'surface_wall',
            'surface_floor' => 'surface_floor',
            'surface_parcel' => 'parcel_surface',
        ];
        foreach ($surfaceMap as $permKey => $requestField) {
            if ($this->canField($permKey)) {
                $data[$permKey] = $this->getDomoprimeValue($requestField);
            }
        }

        // Permission-gated pricing (domoprime — from request.pricing.name)
        if ($this->canField('pricing')) {
            $request = $this->getDomoprimeRequest();
            $data['pricing'] = $request?->relationLoaded('pricing') && $request->pricing
                ? $request->pricing->name
                : null;
        }

        // Permission-gated energy class (domoprime)
        if ($this->canField('class_energy')) {
            $data['class_energy'] = $this->getDomoprimeValue('energy_class');
        }

        // Domoprime calculation status (tpl:1744 — calculationForPager component inside customer column)
        if ($this->relationLoaded('domoprimeCalculation') && $this->domoprimeCalculation->isNotEmpty()) {
            $calc = $this->domoprimeCalculation->first();
            $statusMap = ['ACCEPTED' => 'Accepté', 'REFUSED' => 'Refusé'];
            $data['calculation'] = [
                'status' => $calc->status,
                'status_i18n' => $statusMap[$calc->status] ?? $calc->status,
                'is_accepted' => $calc->status === 'ACCEPTED',
            ];
        }

        // Permission-gated Prime Rénov (tpl:1058–1089, via customer.primerenov)
        if ($this->canField('prime_renov')) {
            $primerenov = $this->relationLoaded('customer') && $this->customer
                && $this->customer->relationLoaded('primerenov') && $this->customer->primerenov
                ? $this->customer->primerenov
                : null;

            $data['prime_renov'] = $primerenov ? [
                'reference' => $primerenov->reference,
                'amount' => $primerenov->amount,
                'state1' => $primerenov->state1,
                'state2' => $primerenov->state2,
            ] : null;
        }

        // Computed state flags for frontend toggle display
        // Wrapped in try/catch: if settings table is missing or empty, default to false
        try {
            $settings = app(ContractSettingsService::class);
            $cancelStatusId = $settings->getStatusForCancel();
            $blowingStatusId = $settings->getStatusForBlowing();
            $placementStatusId = $settings->getStatusForPlacement();

            $data['is_cancelled'] = $cancelStatusId && $this->state_id === $cancelStatusId;
            $data['is_blowing'] = $blowingStatusId && $this->state_id === $blowingStatusId;
            $data['is_placement'] = $placementStatusId && $this->state_id === $placementStatusId;
        } catch (\Throwable $e) {
            $data['is_cancelled'] = false;
            $data['is_blowing'] = false;
            $data['is_placement'] = false;
        }

        return $data;
    }

    /**
     * Get the first domoprime ISO request for this contract (cached).
     */
    protected function getDomoprimeRequest(): mixed
    {
        if (!$this->relationLoaded('domoprimeIsoRequest')) {
            return null;
        }

        return $this->domoprimeIsoRequest->first();
    }

    /**
     * Get a value from the domoprime ISO request.
     * Surfaces, energy class, etc. are stored as direct columns on the request.
     */
    protected function getDomoprimeValue(string $field): mixed
    {
        return $this->getDomoprimeRequest()?->$field;
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

        if ($this->canField('customer_phone')) {
            $customer['phone'] = $this->customer->phone;
            $customer['mobile'] = $this->customer->mobile;
        }

        if ($this->customer->relationLoaded('addresses') && $this->customer->addresses->isNotEmpty()) {
            $addr = $this->customer->addresses->first();
            $address = ['id' => $addr->id, 'address1' => $addr->address1, 'address2' => $addr->address2, 'country' => $addr->country];
            if ($this->canField('customer_postcode')) {
                $address['postcode'] = $addr->postcode;
            }
            if ($this->canField('customer_city')) {
                $address['city'] = $addr->city;
            }
            $customer['address'] = $address;
        }

        return $customer;
    }
}
