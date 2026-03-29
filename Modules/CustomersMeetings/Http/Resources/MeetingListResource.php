<?php

namespace Modules\CustomersMeetings\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\CustomersMeetings\Services\MeetingSettingsService;

/**
 * Meeting List Resource - Optimized for table/list display
 *
 * Returns columns conditionally based on user permissions,
 * matching the Symfony template per-column hasCredential() checks.
 */
class MeetingListResource extends JsonResource
{
    public const FIELD_PERMISSIONS = [
        'id'             => 'meeting_view_list_id',
        'customer'       => 'meeting_list_view_lastname',
        'customer_phone' => 'meeting_list_view_phone',
        'customer_mobile' => 'meeting_list_view_mobile',
        'customer_postcode' => 'meeting_list_view_postcode',
        'customer_city'  => 'meeting_list_view_city',
        'customer_company' => 'meeting_list_company',
        'in_at'          => 'meeting_list_in_at',
        'out_at'         => 'meeting_list_out_at',
        'callback_at'    => 'meeting_view_list_callback_datetime',
        'created_at_date' => 'meeting_view_list_created_date',
        'creation_at'    => 'meeting_view_list_creation_date',
        'treated_at'     => 'meeting_view_list_treatment_date',
        'confirmed_at'   => 'meeting_list_confirmed_at',
        'opc_at'         => 'meeting_list_opc_at',
        'opc_range'      => 'meeting_list_view_opc_range',
        'telepro'        => 'meeting_list_view_telepro',
        'sales'          => 'meeting_list_view_sale',
        'sale2'          => 'meeting_list_view_sale2',
        'assistant'      => 'meeting_list_view_assistant',
        'creator'        => 'meeting_list_view_creator',
        'confirmed_by'   => 'meeting_list_view_confirmed_by',
        'confirmator'    => 'meeting_list_view_confirmator',
        'meeting_status' => 'meeting_list_view_state',
        'status_call'    => 'meeting_list_view_callstatus',
        'status_lead'    => 'meeting_list_view_statuslead',
        'meeting_type'   => 'meeting_list_view_type',
        'campaign'       => 'meeting_list_view_campaign',
        'callcenter'     => 'meeting_list_view_callcenter',
        'partner_layer'  => 'meeting_list_view_partner_layer',
        'polluter'       => 'meeting_list_view_polluter',
        'company'        => 'meeting_list_view_company',
        'is_confirmed'   => 'meeting_list_view_confirmed',
        'is_hold'        => 'meeting_view_list_hold',
        'is_hold_quote'  => 'meeting_view_list_hold_quote',
        'is_qualified'   => 'meeting_list_view_qualified',
        'turnover'       => 'meeting_list_view_turnover',
        'status'         => 'meeting_list_view_status',
        'surface_top'    => 'app_domoprime_iso_meeting_list_surface_from_form_101',
        'surface_wall'   => 'app_domoprime_iso_meeting_list_surface_from_form_102',
        'surface_floor'  => 'app_domoprime_iso_meeting_list_surface_from_form_103',
    ];

    protected static array $permittedFields = [];

    public static function setPermittedFields(array $fields): void
    {
        static::$permittedFields = array_flip($fields);
    }

    public const ALWAYS_VISIBLE_COLUMNS = [
        'customer',
        'in_at',
        'meeting_status',
        'telepro',
        'customer_phone',
        'customer_postcode',
        'customer_city',
    ];

    public const COLUMN_HEADER_PERMISSIONS = [
        'id'             => [['superadmin', 'meeting_view_list_id']],
        'sales'          => [['superadmin', 'admin', 'meeting_view_list_sale1']],
        'sale2'          => [['superadmin', 'admin', 'meeting_view_list_sale2']],
        'telepro'        => [['superadmin', 'admin', 'meeting_view_list_telepro']],
        'assistant'      => [['superadmin', 'admin', 'meeting_view_list_assistant']],
        'partner_layer'  => [['superadmin', 'admin', 'meeting_view_list_partner_layer']],
        'polluter'       => [['superadmin', 'admin', 'meeting_view_list_polluter']],
        'callcenter'     => [['superadmin', 'admin', 'meeting_view_list_callcenter']],
        'meeting_status' => [['superadmin', 'admin', 'meeting_view_list_state']],
        'status_call'    => [['superadmin', 'admin', 'meeting_view_list_callstatus']],
        'status_lead'    => [['superadmin', 'admin', 'meeting_view_list_lead_status']],
        'meeting_type'   => [['superadmin', 'admin', 'meeting_view_list_type']],
        'opc_range'      => [['superadmin', 'meeting_list_view_opc_range']],
        'is_confirmed'   => [['superadmin', 'meeting_view_list_confirmed']],
        'is_hold'        => [['superadmin', 'admin', 'meeting_view_list_hold']],
        'is_hold_quote'  => [['superadmin', 'meeting_view_list_hold_quote']],
        'is_qualified'   => [['superadmin', 'admin', 'meeting_view_list_qualified']],
        'creator'        => [['superadmin', 'meeting_view_list_createdby']],
        'confirmator'    => [['superadmin', 'admin', 'meeting_view_list_confirmator']],
        'company'        => [['superadmin', 'admin', 'meeting_view_list_company']],
        'campaign'       => [['superadmin', 'admin', 'meeting_view_list_campaign']],
        'turnover'       => [['superadmin', 'admin', 'meeting_view_list_turnover']],
        'status'         => [['superadmin', 'admin', 'meeting_view_list_status']],
        'surface_top'    => [['superadmin', 'app_domoprime_iso_meeting_list_surface_from_form_101']],
        'surface_wall'   => [['superadmin', 'app_domoprime_iso_meeting_list_surface_from_form_102']],
        'surface_floor'  => [['superadmin', 'app_domoprime_iso_meeting_list_surface_from_form_103']],
    ];

    public static function resolveVisibleColumns($user): array
    {
        $visible = [];

        foreach (self::COLUMN_HEADER_PERMISSIONS as $key => $credentials) {
            if (isset($credentials[0]) && is_array($credentials[0])) {
                if ($user->hasCredential($credentials)) {
                    $visible[] = $key;
                }
            } else {
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

    public static function resolvePermittedFields($user): array
    {
        $isSuperadmin = $user->isSuperadmin();
        $permitted = [];

        foreach (self::FIELD_PERMISSIONS as $key => $credentials) {
            if (is_array($credentials)) {
                foreach ($credentials as $cred) {
                    if ($user->hasExplicitCredential($cred)) {
                        $permitted[] = $key;
                        break;
                    }
                }
            } else {
                if ($isSuperadmin || $user->hasCredential($credentials)) {
                    $permitted[] = $key;
                }
            }
        }

        return $permitted;
    }

    protected static function can(string $fieldKey): bool
    {
        if (empty(static::$permittedFields)) {
            return true;
        }

        return isset(static::$permittedFields[$fieldKey]);
    }

    protected function isAuthorized(): bool
    {
        $user = request()->user();
        if (!$user) return false;

        if ($user->hasCredential([['superadmin', 'admin', 'meeting_owner']])) {
            return true;
        }

        if (!$user->hasCredential('meeting_list_owner')) {
            return true;
        }

        $userId = $user->id;
        return $this->assistant_id === $userId
            || $this->telepro_id === $userId
            || $this->sales_id === $userId
            || $this->sale2_id === $userId;
    }

    protected function canField(string $fieldKey): bool
    {
        return $this->isAuthorized() || static::can($fieldKey);
    }

    public function toArray($request): array
    {
        $data = [
            'id' => $this->id,
            'registration' => $this->registration,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'remarks' => $this->remarks,
            'sale_comments' => $this->sale_comments,
            'variables' => $this->variables_array ?? json_decode($this->variables, true),
            'is_locked' => $this->is_locked,
            'lock_user_id' => $this->lock_user_id,
            'lock_time' => $this->lock_time?->format('Y-m-d H:i:s'),
            'lock_user' => $this->formatUserRelation('lockUser'),
            'is_callback_cancelled' => $this->is_callback_cancelled,
            'callback_cancel_at' => $this->callback_cancel_at?->format('Y-m-d H:i:s'),
            'is_works_hold' => $this->is_works_hold,
            'products' => $this->when(
                $this->relationLoaded('products') && $this->products->isNotEmpty(),
                fn () => $this->products->map(fn ($p) => [
                    'id' => $p->id,
                    'product_id' => $p->product_id,
                ])->toArray()
            ),
            'comments' => $this->when(
                $this->relationLoaded('comments') && $this->comments->isNotEmpty(),
                fn () => $this->comments->map(fn ($c) => [
                    'id' => $c->id,
                    'comment' => $c->comment,
                    'type' => $c->type,
                    'created_at' => $c->created_at?->format('Y-m-d H:i:s'),
                ])->toArray()
            ),
        ];

        // Permission-gated dates
        if ($this->canField('in_at')) {
            $data['in_at'] = $this->in_at?->format('Y-m-d H:i:s');
        }
        if ($this->canField('out_at')) {
            $data['out_at'] = $this->out_at?->format('Y-m-d H:i:s');
        }
        if ($this->canField('callback_at')) {
            $data['callback_at'] = $this->callback_at?->format('Y-m-d H:i:s');
        }
        if ($this->canField('created_at_date')) {
            // "Booked in" date - created_at already in base data
        }
        if ($this->canField('creation_at')) {
            $data['creation_at'] = $this->creation_at?->format('Y-m-d H:i:s');
        }
        if ($this->canField('treated_at')) {
            $data['treated_at'] = $this->treated_at?->format('Y-m-d H:i:s');
        }
        if ($this->canField('confirmed_at')) {
            $data['confirmed_at'] = $this->confirmed_at?->format('Y-m-d H:i:s');
        }
        if ($this->canField('opc_at')) {
            $data['opc_at'] = $this->opc_at?->format('Y-m-d H:i:s');
        }

        // State updated at (always included)
        $data['state_updated_at'] = $this->state_updated_at?->format('Y-m-d H:i:s');

        // OPC Range (Install range with color + i18n)
        if ($this->canField('opc_range')) {
            $data['opc_range_id'] = $this->opc_range_id;
            $data['opc_range'] = $this->formatRelation('opcRange', fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'color' => $r->color ?? null,
                'from' => $r->from,
                'to' => $r->to,
            ]);
        }

        // In At Range (meeting date range with i18n)
        $data['in_at_range_id'] = $this->in_at_range_id;
        if ($this->relationLoaded('inAtRange') && $this->inAtRange) {
            $translation = $this->inAtRange->relationLoaded('translations')
                ? $this->inAtRange->translations->first()
                : null;
            $data['in_at_range'] = [
                'id' => $this->inAtRange->id,
                'name' => $this->inAtRange->name,
                'color' => $this->inAtRange->color ?? null,
                'value' => $translation?->value ?? $this->inAtRange->name,
            ];
        }

        // Permission-gated customer
        if ($this->canField('customer') && $this->relationLoaded('customer') && $this->customer) {
            $data['customer'] = $this->formatCustomer();
        }

        // Permission-gated users
        foreach (['telepro' => 'telepro_id', 'sales' => 'sales_id', 'sale2' => 'sale2_id', 'assistant' => 'assistant_id'] as $permKey => $fk) {
            if ($this->canField($permKey)) {
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatUserRelation($permKey);
            }
        }

        // Permission-gated creator
        if ($this->canField('creator')) {
            $data['created_by_id'] = $this->created_by_id;
            $data['creator'] = $this->formatUserRelation('creator');
        }

        // Permission-gated confirmed_by
        if ($this->canField('confirmed_by')) {
            $data['confirmed_by_id'] = $this->confirmed_by_id;
            $data['confirmed_by'] = $this->formatUserRelation('confirmedBy');
        }

        // Permission-gated confirmator
        if ($this->canField('confirmator')) {
            $data['confirmator_id'] = $this->confirmator_id;
            $data['confirmator'] = $this->formatUserRelation('confirmator');
        }

        // Permission-gated named relations
        foreach (['partner_layer' => 'partner_layer_id', 'company' => 'company_id'] as $permKey => $fk) {
            if ($this->canField($permKey)) {
                $relation = lcfirst(str_replace('_', '', ucwords($permKey, '_')));
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatRelation($relation, fn ($r) => [
                    'id' => $r->id,
                    'name' => mb_strtoupper($r->name),
                ]);
            }
        }

        // Polluter
        if ($this->canField('polluter')) {
            $data['polluter_id'] = $this->polluter_id;
            $data['polluter'] = $this->formatRelation('polluter', fn ($r) => [
                'id' => $r->id,
                'name' => mb_strtoupper($r->name),
                'commercial' => $r->commercial,
                'type' => $r->type,
            ]);
        }

        // Campaign
        if ($this->canField('campaign')) {
            $data['campaign_id'] = $this->campaign_id;
            $data['campaign'] = $this->formatRelation('campaign', fn ($c) => [
                'id' => $c->id,
                'name' => $c->name ?? (string) $c->id,
            ]);
        }

        // Callcenter
        if ($this->canField('callcenter')) {
            $data['callcenter_id'] = $this->callcenter_id;
            $data['callcenter'] = $this->formatRelation('callcenter', fn ($c) => [
                'id' => $c->id,
                'name' => $c->name ?? null,
            ]);
        }

        // Permission-gated statuses
        $statuses = [
            'meeting_status' => ['meetingStatus', 'state_id'],
            'status_call'    => ['statusCall', 'status_call_id'],
            'status_lead'    => ['statusLead', 'status_lead_id'],
        ];
        foreach ($statuses as $permKey => [$relation, $fk]) {
            if ($this->canField($permKey)) {
                $data[$fk] = $this->$fk;
                $data[$permKey] = $this->formatStatusRelation($relation);
            }
        }

        // Meeting type
        if ($this->canField('meeting_type')) {
            $data['type_id'] = $this->type_id;
            $data['meeting_type'] = $this->formatStatusRelation('meetingType');
        }

        // Permission-gated boolean flags
        foreach (['is_confirmed', 'is_hold_quote', 'is_qualified', 'status'] as $flag) {
            if ($this->canField($flag)) {
                $data[$flag] = $this->$flag;
            }
        }
        if ($this->canField('is_hold')) {
            $data['is_hold'] = $this->is_hold;
        }

        // Turnover
        if ($this->canField('turnover')) {
            $data['turnover'] = (float) $this->turnover;
        }

        // Domoprime ISO surfaces
        if ($this->relationLoaded('domoprimeRequest') && $this->domoprimeRequest) {
            $req = $this->domoprimeRequest;
            if ($this->canField('surface_top')) {
                $data['surface_top'] = (float) $req->surface_top;
            }
            if ($this->canField('surface_wall')) {
                $data['surface_wall'] = (float) $req->surface_wall;
            }
            if ($this->canField('surface_floor')) {
                $data['surface_floor'] = (float) $req->surface_floor;
            }
        }

        // Computed state flags (use static cache to avoid repeated S3/storage lookups)
        try {
            static $cancelStatusId = null;
            static $cancelStatusResolved = false;

            if (!$cancelStatusResolved) {
                $settings = app(MeetingSettingsService::class);
                $cancelStatusId = $settings->getStatusForCancel();
                $cancelStatusResolved = true;
            }

            $data['is_cancelled'] = $cancelStatusId && $this->state_id === $cancelStatusId;
        } catch (\Throwable $e) {
            $data['is_cancelled'] = false;
        }

        return $data;
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
                    'color' => $status->color ?? null,
                    'icon' => $status->icon ?? null,
                    'value' => $translation?->value ?? $status->name,
                ];
            }
        );
    }

    protected function formatCustomer(): array
    {
        $customer = [
            'id' => $this->customer->id,
            'gender' => $this->customer->gender,
            'lastname' => $this->customer->lastname,
            'firstname' => $this->customer->firstname,
            'company' => $this->customer->company,
            'email' => $this->customer->email,
            'status' => $this->customer->status,
        ];

        if ($this->canField('customer_phone')) {
            $customer['phone'] = $this->customer->phone;
        }

        if ($this->canField('customer_mobile') || $this->canField('customer_phone')) {
            $customer['mobile'] = $this->customer->mobile;
            $customer['mobile2'] = $this->customer->mobile2;
        }

        if ($this->customer->relationLoaded('addresses') && $this->customer->addresses->isNotEmpty()) {
            $addr = $this->customer->addresses->first();
            $address = [
                'id' => $addr->id,
                'address1' => $addr->address1,
                'address2' => $addr->address2,
                'country' => $addr->country,
                'state' => $addr->state,
                'coordinates' => $addr->coordinates,
            ];
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
