<?php

namespace Modules\CustomersMeetings\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\CustomersMeetings\Entities\CustomerMeeting;
use Modules\CustomersMeetings\Entities\CustomerMeetingHistory;

/**
 * Meeting Repository
 *
 * Handles all database operations for customer meetings.
 * Reproduces the query logic from Symfony's CustomerMeetingsFormFilter + CustomerMeetingsPager.
 */
class MeetingRepository
{
    protected const PERMISSION_RELATIONS = [
        'customer'      => 'customer.addresses',
        'telepro'       => 'telepro:id,firstname,lastname',
        'sales'         => 'sales:id,firstname,lastname',
        'sale2'         => 'sale2:id,firstname,lastname',
        'assistant'     => 'assistant:id,firstname,lastname',
        'creator'       => 'creator:id,firstname,lastname',
        'confirmed_by'  => 'confirmedBy:id,firstname,lastname',
        'confirmator'   => 'confirmator:id,firstname,lastname',
        'lock_user'     => 'lockUser:id,firstname,lastname',
        'meeting_status' => 'meetingStatus.translations',
        'status_call'   => 'statusCall.translations',
        'status_lead'   => 'statusLead.translations',
        'meeting_type'  => 'meetingType.translations',
        'campaign'      => 'campaign',
        'partner_layer' => 'partnerLayer:id,name',
        'polluter'      => 'polluter:id,name,commercial,type',
        'company'       => 'company:id,name',
        'callcenter'    => 'callcenter',
        'opc_range'     => 'opcRange',
        'in_at_range'   => 'inAtRange.translations',
    ];

    public function getFilteredMeetings(array $filters, int $perPage = 100, array $permittedFields = []): LengthAwarePaginator
    {
        $lang = $filters['lang'] ?? 'fr';

        $query = CustomerMeeting::query()
            ->notInProgress();

        $eagerLoad = $this->buildEagerLoad($permittedFields, $lang);
        $query->with($eagerLoad);

        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters);

        return $query->paginate($perPage);
    }

    /**
     * Get meetings for the schedule/calendar view (no pagination, all in date range).
     */
    public function getScheduleMeetings(array $filters): \Illuminate\Database\Eloquent\Collection
    {
        $lang = $filters['lang'] ?? 'fr';

        $query = CustomerMeeting::query()
            ->notInProgress();

        $query->with([
            'customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE'),
            'telepro:id,firstname,lastname',
            'sales:id,firstname,lastname',
            'sale2:id,firstname,lastname',
            'assistant:id,firstname,lastname',
            'meetingStatus.translations' => fn ($q) => $q->where('lang', $lang),
            'statusCall.translations' => fn ($q) => $q->where('lang', $lang),
            'campaign:id,name',
            'callcenter',
        ]);

        $this->applyFilters($query, $filters);

        $query->orderBy('in_at', 'asc');

        return $query->get();
    }

    protected function buildEagerLoad(array $permittedFields, string $lang): array
    {
        $eagerLoad = [
            'products',
            'comments' => fn ($q) => $q->where('status', 'ACTIVE')->orderBy('created_at', 'desc'),
            'domoprimeRequest',
            'domoprimeRequest.energy',
            'domoprimeRequest.previousEnergy',
            'domoprimeRequest.occupation',
            'domoprimeRequest.layerType',
            'domoprimeRequest.pricing',
        ];

        $permittedIndex = ! empty($permittedFields) ? array_flip($permittedFields) : [];
        $loadAll = empty($permittedIndex);

        foreach (self::PERMISSION_RELATIONS as $permKey => $relation) {
            if ($loadAll || isset($permittedIndex[$permKey])) {
                if (str_contains($relation, '.translations')) {
                    $eagerLoad[$relation] = fn ($q) => $q->where('lang', $lang);
                } elseif ($relation === 'customer.addresses') {
                    $eagerLoad[$relation] = fn ($q) => $q->where('status', 'ACTIVE');
                } else {
                    $eagerLoad[] = $relation;
                }
            }
        }

        return $eagerLoad;
    }

    protected function applyFilters($query, array $filters): void
    {
        // Status ACTIVE/DELETE (default: ACTIVE)
        $query->where('status', $filters['status'] ?? 'ACTIVE');

        // Direct equal filters
        $equalFields = [
            'telepro_id', 'sales_id', 'sale2_id', 'assistant_id',
            'created_by_id', 'confirmed_by_id', 'campaign_id', 'customer_id',
            'callcenter_id', 'type_id', 'confirmator_id', 'company_id',
            'in_at_range_id',
        ];
        foreach ($equalFields as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        // Nullable filters (support IS_NULL)
        $nullableFields = [
            'state_id', 'status_call_id', 'status_lead_id',
            'partner_layer_id', 'polluter_id', 'company_id',
            'opc_range_id',
        ];
        foreach ($nullableFields as $field) {
            if (! empty($filters[$field])) {
                $filters[$field] === 'IS_NULL'
                    ? $query->whereNull($field)
                    : $query->where($field, $filters[$field]);
            }
        }

        // Boolean flags
        foreach (['is_hold', 'is_confirmed', 'is_hold_quote', 'is_qualified', 'is_locked'] as $flag) {
            if (! empty($filters[$flag])) {
                if ($filters[$flag] === 'NO') {
                    $query->where(function ($q) use ($flag) {
                        $q->where($flag, 'NO')->orWhere($flag, '');
                    });
                } else {
                    $query->where($flag, $filters[$flag]);
                }
            }
        }

        // Customer name search (case-insensitive)
        if (! empty($filters['search_lastname'])) {
            $search = mb_strtolower($filters['search_lastname']);
            $query->whereHas('customer', fn ($q) => $q
                ->whereRaw('LOWER(lastname) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(firstname) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(company) LIKE ?', ["%{$search}%"]));
        }

        // Phone search
        if (! empty($filters['search_phone'])) {
            $phone = $filters['search_phone'];
            $query->whereHas('customer', fn ($q) => $q
                ->where('phone', 'LIKE', "%{$phone}%")
                ->orWhere('mobile', 'LIKE', "%{$phone}%"));
        }

        // City search (case-insensitive)
        if (! empty($filters['search_city'])) {
            $city = mb_strtolower($filters['search_city']);
            $query->whereHas('customer.addresses', fn ($q) => $q->whereRaw('LOWER(city) LIKE ?', ["%{$city}%"]));
        }

        // ID search
        if (! empty($filters['search_id'])) {
            $query->where('id', $filters['search_id']);
        }

        // Postcode starts-with
        if (! empty($filters['postcode'])) {
            $postcodes = is_array($filters['postcode']) ? $filters['postcode'] : [$filters['postcode']];
            $query->whereHas('customer.addresses', fn ($q) => $q->where(function ($sq) use ($postcodes) {
                foreach ($postcodes as $pc) {
                    $sq->orWhere('postcode', 'LIKE', $pc . '%');
                }
            }));
        }

        // IN filters
        $inFilters = [
            'in_telepro_id' => 'telepro_id',
            'in_sales_id' => 'sales_id',
            'in_sale2_id' => 'sale2_id',
            'in_assistant_id' => 'assistant_id',
            'in_confirmed_by_id' => 'confirmed_by_id',
            'in_confirmator_id' => 'confirmator_id',
            'in_state_id' => 'state_id',
            'in_status_call_id' => 'status_call_id',
            'in_status_lead_id' => 'status_lead_id',
            'in_type_id' => 'type_id',
            'in_campaign_id' => 'campaign_id',
            'in_callcenter_id' => 'callcenter_id',
            'in_partner_layer_id' => 'partner_layer_id',
            'in_polluter_id' => 'polluter_id',
            'in_company_id' => 'company_id',
            'in_opc_range_id' => 'opc_range_id',
            'in_created_by_id' => 'created_by_id',
        ];
        foreach ($inFilters as $filterKey => $column) {
            if (! empty($filters[$filterKey])) {
                $values = is_array($filters[$filterKey]) ? $filters[$filterKey] : explode(',', $filters[$filterKey]);
                $query->whereIn($column, $values);
            }
        }

        // Date range filters (specific per-field ranges)
        foreach (['in_at', 'created_at', 'treated_at', 'creation_at', 'callback_at', 'confirmed_at', 'opc_at'] as $field) {
            $this->applyDateRange($query, $filters, $field);
        }

        // Generic sidebar date filter: date_from + date_to + date_type
        if (! empty($filters['date_from']) || ! empty($filters['date_to'])) {
            $validDateFields = ['in_at', 'created_at', 'treated_at', 'creation_at', 'callback_at', 'confirmed_at', 'opc_at'];
            $dateTypes = ! empty($filters['date_type']) ? explode(',', $filters['date_type']) : ['in_at'];

            foreach ($dateTypes as $dateField) {
                $dateField = trim($dateField);
                if (in_array($dateField, $validDateFields)) {
                    $this->applyDateRange($query, [
                        "{$dateField}_from" => $filters['date_from'] ?? null,
                        "{$dateField}_to" => $filters['date_to'] ?? null,
                    ], $dateField);
                }
            }
        }

        // Turnover range
        if (! empty($filters['turnover_min'])) {
            $query->where('turnover', '>=', $filters['turnover_min']);
        }
        if (! empty($filters['turnover_max'])) {
            $query->where('turnover', '<=', $filters['turnover_max']);
        }
    }

    protected function applyDateRange($query, array $filters, string $field): void
    {
        if (! empty($filters["{$field}_from"])) {
            $from = $filters["{$field}_from"];
            if (strlen($from) === 10) {
                $from .= ' 00:00:00';
            }
            $query->where($field, '>=', $from);
        }

        if (! empty($filters["{$field}_to"])) {
            $to = $filters["{$field}_to"];
            if (strlen($to) === 10) {
                $to .= ' 23:59:59';
            }
            $query->where($field, '<=', $to);
        }
    }

    protected function applySorting($query, array $filters): void
    {
        $sortBy = $filters['sort_by'] ?? 'in_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        if (! in_array($sortOrder, ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $directSortFields = [
            'id', 'in_at', 'created_at', 'treated_at', 'creation_at',
            'callback_at', 'confirmed_at', 'opc_at', 'turnover',
        ];

        if (in_array($sortBy, $directSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } elseif ($sortBy === 'lastname') {
            $query->orderBy(
                \Modules\Customer\Entities\Customer::select('lastname')
                    ->whereColumn('t_customers.id', 't_customers_meeting.customer_id')
                    ->limit(1),
                $sortOrder
            );
        } elseif ($sortBy === 'postcode') {
            $query->orderBy(
                \Modules\Customer\Entities\CustomerAddress::select('postcode')
                    ->whereColumn('t_customers_address.customer_id', 't_customers_meeting.customer_id')
                    ->where('status', 'ACTIVE')
                    ->limit(1),
                $sortOrder
            );
        } elseif ($sortBy === 'city') {
            $query->orderBy(
                \Modules\Customer\Entities\CustomerAddress::select('city')
                    ->whereColumn('t_customers_address.customer_id', 't_customers_meeting.customer_id')
                    ->where('status', 'ACTIVE')
                    ->limit(1),
                $sortOrder
            );
        } else {
            $query->orderBy('in_at', 'desc');
        }
    }

    public function find(int $id): ?CustomerMeeting
    {
        return CustomerMeeting::find($id);
    }

    public function findWithRelations(int $id): ?CustomerMeeting
    {
        return CustomerMeeting::with([
            'customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE'),
            'telepro:id,firstname,lastname',
            'sales:id,firstname,lastname',
            'sale2:id,firstname,lastname',
            'assistant:id,firstname,lastname',
            'creator:id,firstname,lastname',
            'confirmedBy:id,firstname,lastname',
            'confirmator:id,firstname,lastname',
            'lockUser:id,firstname,lastname',
            'meetingStatus.translations',
            'statusCall.translations',
            'statusLead.translations',
            'meetingType.translations',
            'campaign:id,name',
            'partnerLayer:id,name',
            'polluter:id,name,commercial,type',
            'company:id,name',
            'callcenter',
            'opcRange',
            'inAtRange.translations',
            'products',
            'comments' => fn ($q) => $q->where('status', 'ACTIVE')->orderBy('created_at', 'desc'),
            'history',
            'domoprimeRequest',
            'domoprimeRequest.energy',
            'domoprimeRequest.previousEnergy',
            'domoprimeRequest.occupation',
            'domoprimeRequest.layerType',
            'domoprimeRequest.pricing',
        ])->find($id);
    }

    public function create(array $data): CustomerMeeting
    {
        return CustomerMeeting::create($data);
    }

    public function update(CustomerMeeting $meeting, array $data): CustomerMeeting
    {
        $meeting->update($data);
        $meeting->refresh();

        return $meeting;
    }

    public function softDelete(CustomerMeeting $meeting): bool
    {
        return $meeting->update(['status' => 'DELETE']);
    }

    public function logHistory(CustomerMeeting $meeting, string $message, $user, ?int $oldStatusId = null, ?int $newStatusId = null): ?CustomerMeetingHistory
    {
        $stateId = $meeting->state_id ?: $meeting->getOriginal('state_id');

        $oldId = (int) ($oldStatusId ?? $stateId);
        $newId = (int) ($newStatusId ?? $stateId);

        // FK constraint: status_id must reference a valid row, skip if 0
        if ($oldId <= 0 || $newId <= 0) {
            return null;
        }

        return CustomerMeetingHistory::create([
            'customer_id' => $meeting->customer_id,
            'user_id' => $user->id,
            'old_status_id' => $oldId,
            'new_status_id' => $newId,
            'comment' => $message,
        ]);
    }

    public function getHistory(int $meetingId)
    {
        $meeting = CustomerMeeting::find($meetingId);

        if (! $meeting) {
            return collect();
        }

        return CustomerMeetingHistory::where('customer_id', $meeting->customer_id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getStatistics(): array
    {
        return [
            'total_meetings' => CustomerMeeting::active()->count(),
            'total_confirmed' => CustomerMeeting::active()->confirmed()->count(),
            'total_unconfirmed' => CustomerMeeting::active()->confirmed(false)->count(),
            'by_status' => CustomerMeeting::active()
                ->select('state_id', DB::raw('count(*) as count'))
                ->groupBy('state_id')
                ->with('meetingStatus')
                ->get(),
            'by_status_call' => CustomerMeeting::active()
                ->select('status_call_id', DB::raw('count(*) as count'))
                ->where('status_call_id', '>', 0)
                ->groupBy('status_call_id')
                ->with('statusCall')
                ->get(),
            'recent_meetings' => CustomerMeeting::active()
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
        ];
    }

    public function getFilterOptions(string $lang = 'fr'): array
    {
        $formatStatus = fn ($collection) => $collection->map(function ($s) use ($lang) {
            // Prefer exact lang match, fallback to empty lang, fallback to model name
            $exactVal = $s->translations->firstWhere('lang', $lang)?->value;
            $emptyVal = $s->translations->firstWhere('lang', '')?->value;
            // Use first non-empty value in priority order
            $name = (is_string($exactVal) && $exactVal !== '') ? $exactVal
                  : ((is_string($emptyVal) && $emptyVal !== '') ? $emptyVal
                  : ($s->name ?? ''));
            return ['id' => $s->id, 'name' => $name];
        })->filter(fn ($item) => $item['name'] !== '' && $item['name'] !== null)->values();

        $withTranslations = fn ($q) => $q->whereIn('lang', [$lang, '']);

        return [
            'meeting_statuses' => $formatStatus(
                \Modules\CustomersMeetings\Entities\CustomerMeetingStatus::with(['translations' => $withTranslations])->get()
            ),
            'status_calls' => $formatStatus(
                \Modules\CustomersMeetings\Entities\CustomerMeetingStatusCall::with(['translations' => $withTranslations])->get()
            ),
            'status_leads' => $formatStatus(
                \Modules\CustomersMeetings\Entities\CustomerMeetingStatusLead::with(['translations' => $withTranslations])->get()
            ),
            'meeting_types' => $formatStatus(
                \Modules\CustomersMeetings\Entities\CustomerMeetingType::with(['translations' => $withTranslations])->get()
            ),
            'campaigns' => \Modules\CustomersMeetings\Entities\CustomerMeetingCampaign::select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
            'date_ranges' => $formatStatus(
                \Modules\CustomersMeetings\Entities\CustomerMeetingDateRange::with(['translations' => $withTranslations])
                    ->orderBy('from')
                    ->get()
            ),
            'users' => \Modules\UsersGuard\Entities\User::select('id', 'firstname', 'lastname')
                ->where('is_active', 'YES')
                ->orderBy('lastname')
                ->get()
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => mb_strtoupper(trim($u->lastname . ' ' . $u->firstname)),
                ]),
            'companies' => \Modules\CustomersContracts\Entities\CustomerContractCompany::select('id', 'name')
                ->where('is_active', 'YES')
                ->orderBy('name')
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
            'callcenters' => \Modules\User\Entities\Callcenter::select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
            'partner_layers' => \Modules\PartnerLayer\Entities\PartnerLayerCompany::select('id', 'name')
                ->where('is_active', 'YES')
                ->orderBy('name')
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
            'polluters' => \Modules\PartnerPolluter\Entities\PartnerPolluterCompany::select('id', 'name')
                ->where('is_active', 'YES')
                ->orderBy('name')
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
            'products' => DB::table('t_customers_meeting_product')
                ->join('t_products', 't_products.id', '=', 't_customers_meeting_product.product_id')
                ->select('t_products.id', 't_products.reference as name')
                ->distinct()
                ->orderBy('t_products.reference')
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
            'energies' => DB::table('t_domoprime_energy as e')
                ->leftJoin('t_domoprime_energy_i18n as i', function ($j) use ($lang) {
                    $j->on('i.energy_id', '=', 'e.id')->where('i.lang', '=', $lang);
                })
                ->select('e.id', DB::raw('COALESCE(i.value, e.name) as name'))
                ->orderBy('name')
                ->get()
                ->map(fn ($e) => ['id' => $e->id, 'name' => $e->name]),
            'previous_energies' => DB::table('t_domoprime_previous_energy as e')
                ->leftJoin('t_domoprime_previous_energy_i18n as i', function ($j) use ($lang) {
                    $j->on('i.energy_id', '=', 'e.id')->where('i.lang', '=', $lang);
                })
                ->select('e.id', DB::raw('COALESCE(i.value, e.name) as name'))
                ->orderBy('name')
                ->get()
                ->map(fn ($e) => ['id' => $e->id, 'name' => $e->name]),
            'occupations' => DB::table('t_domoprime_iso_occupation as o')
                ->leftJoin('t_domoprime_iso_occupation_i18n as i', function ($j) use ($lang) {
                    $j->on('i.occupation_id', '=', 'o.id')->where('i.lang', '=', $lang);
                })
                ->select('o.id', DB::raw('COALESCE(i.value, o.name) as name'))
                ->orderBy('name')
                ->get()
                ->map(fn ($o) => ['id' => $o->id, 'name' => $o->name]),
            'layer_types' => DB::table('t_domoprime_iso_type_layer as l')
                ->leftJoin('t_domoprime_iso_type_layer_i18n as i', function ($j) use ($lang) {
                    $j->on('i.type_id', '=', 'l.id')->where('i.lang', '=', $lang);
                })
                ->select('l.id', DB::raw('COALESCE(i.value, l.name) as name'))
                ->orderBy('name')
                ->get()
                ->map(fn ($l) => ['id' => $l->id, 'name' => $l->name]),
            'pricings' => DB::table('t_domoprime_iso_cumac_price')
                ->select('id', 'name')
                ->where('is_active', 'YES')
                ->where('status', 'ACTIVE')
                ->orderBy('name')
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
        ];
    }
}
