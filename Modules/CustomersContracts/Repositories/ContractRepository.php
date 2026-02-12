<?php

namespace Modules\CustomersContracts\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersContracts\Entities\CustomerContractHistory;

/**
 * Contract Repository
 *
 * Handles all database operations for customer contracts.
 * Reproduces the query logic from Symfony's CustomerContractsFormFilter + CustomerContractsPager.
 */
class ContractRepository
{
    /**
     * Get filtered contracts with pagination (list view).
     *
     * Loads all relations needed for the contract list display,
     * matching the Symfony LEFT JOINs:
     * - customer + address
     * - telepro, sale1, sale2, assistant, creator (Users)
     * - team (UserTeam)
     * - contractStatus + i18n
     * - installStatus + i18n
     * - adminStatus + i18n
     * - opcStatus + i18n
     * - timeStatus + i18n
     * - financialPartner (Partner)
     * - partnerLayer (PartnerLayerCompany)
     * - polluter (PartnerPolluterCompany)
     * - company (CustomerContractCompany)
     * - tax
     * - products
     */
    /**
     * Permission key → eager-load relation mapping.
     * Only relations gated by permissions are listed here.
     * Relations always loaded (tax, products, creator, installerUser) are not in this map.
     */
    protected const PERMISSION_RELATIONS = [
        'customer'          => 'customer.addresses',
        'telepro'           => 'telepro:id,firstname,lastname',
        'sale1'             => 'sale1:id,firstname,lastname',
        'sale2'             => 'sale2:id,firstname,lastname',
        'assistant'         => 'assistant:id,firstname,lastname',
        'creator'           => 'creator:id,firstname,lastname',
        'team'              => 'team:id,name',
        'contract_status'   => 'contractStatus.translations',
        'install_status'    => 'installStatus.translations',
        'admin_status'      => 'adminStatus.translations',
        'opc_status'        => 'opcStatus.translations',
        'time_status'       => 'timeStatus.translations',
        'financial_partner' => 'financialPartner:id,name',
        'partner_layer'     => 'partnerLayer:id,name',
        'polluter'          => 'polluter:id,name',
        'company'           => 'company:id,name',
        'campaign'          => 'campaign',
        'contributor'       => 'contributors.user',
    ];

    public function getFilteredContracts(array $filters, int $perPage = 100, array $permittedFields = []): LengthAwarePaginator
    {
        $lang = $filters['lang'] ?? 'fr';

        $query = CustomerContract::query()
            ->notInProgress();

        // Build eager-load list based on permitted fields
        $eagerLoad = $this->buildEagerLoad($permittedFields, $lang);
        $query->with($eagerLoad);

        // Apply all filters
        $this->applyFilters($query, $filters);

        // Sorting (default: opened_at desc, matching Symfony defaults)
        $this->applySorting($query, $filters);

        return $query->paginate($perPage);
    }

    /**
     * Build the eager-load array based on permitted fields.
     * If $permittedFields is empty (backward compat), load everything.
     */
    protected function buildEagerLoad(array $permittedFields, string $lang): array
    {
        // Always loaded regardless of permissions
        $eagerLoad = [
            'installerUser:id,firstname,lastname',
            'tax:id,rate',
            'products',
        ];

        // If no permission filtering, load all relations (backward compat)
        $permittedIndex = ! empty($permittedFields) ? array_flip($permittedFields) : [];
        $loadAll = empty($permittedIndex);

        foreach (self::PERMISSION_RELATIONS as $permKey => $relation) {
            if ($loadAll || isset($permittedIndex[$permKey])) {
                // Status relations need a language-filtered sub-query
                if (str_contains($relation, '.translations')) {
                    $eagerLoad[$relation] = fn ($q) => $q->where('lang', $lang);
                } elseif ($relation === 'customer.addresses') {
                    $eagerLoad[$relation] = fn ($q) => $q->where('status', 'ACTIVE')->limit(1);
                } else {
                    $eagerLoad[] = $relation;
                }
            }
        }

        return $eagerLoad;
    }

    /**
     * Apply all filters to the query.
     *
     * Supports the same filter types as Symfony's CustomerContractsFormFilter:
     * - equal: exact match (status, state_id, is_hold, is_confirmed, etc.)
     * - search: LIKE search (lastname/firstname/company/reference, phone/mobile, city)
     * - begin: starts with (postcode)
     * - in: multiple values (telepro_id[], sale_1_id[], state_id[], etc.)
     * - range: date ranges (opened_at, opc_at, sav_at, signed_at, created_at)
     */
    protected function applyFilters($query, array $filters): void
    {
        // Status ACTIVE/DELETE (default: ACTIVE)
        $query->where('status', $filters['status'] ?? 'ACTIVE');

        // Nullable filters (support IS_NULL for whereNull)
        $nullableFields = [
            'state_id', 'install_state_id', 'admin_status_id',
            'opc_status_id', 'time_state_id', 'partner_layer_id',
            'polluter_id', 'company_id',
            'opc_range_id', 'sav_at_range_id',
        ];
        foreach ($nullableFields as $field) {
            if (! empty($filters[$field])) {
                $filters[$field] === 'IS_NULL'
                    ? $query->whereNull($field)
                    : $query->where($field, $filters[$field]);
            }
        }

        // Product filter (special: uses relation)
        if (! empty($filters['product_id'])) {
            $filters['product_id'] === 'IS_NULL'
                ? $query->whereDoesntHave('products')
                : $query->whereHas('products', fn ($q) => $q->where('product_id', $filters['product_id']));
        }

        // Direct equal filters
        $equalFields = [
            'telepro_id', 'sale_1_id', 'sale_2_id', 'assistant_id',
            'installer_user_id', 'created_by_id', 'team_id', 'campaign_id', 'customer_id',
            'confirmateur_id', 'regie_callcenter',
        ];
        foreach ($equalFields as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        // Financial partner (special: 0 means null or 0)
        if (! empty($filters['financial_partner_id'])) {
            $filters['financial_partner_id'] === '0'
                ? $query->where(fn ($q) => $q->where('financial_partner_id', 0)->orWhereNull('financial_partner_id'))
                : $query->where('financial_partner_id', $filters['financial_partner_id']);
        }

        // Boolean flags (YES/NO and Y/N)
        foreach (['is_hold', 'is_confirmed', 'is_hold_quote', 'is_billable', 'is_signed', 'is_document', 'is_photo', 'is_quality'] as $flag) {
            if (! empty($filters[$flag])) {
                $query->where($flag, $filters[$flag]);
            }
        }

        // Domoprime status filter (plugin: filters on variables JSON or related table)
        if (! empty($filters['domoprime_status'])) {
            if ($filters['domoprime_status'] === 'IS_NULL') {
                $query->where(function ($q) {
                    $q->whereNull('variables')
                        ->orWhere('variables', '')
                        ->orWhereRaw("JSON_VALID(variables) = 0")
                        ->orWhereRaw("JSON_EXTRACT(variables, '$.domoprime_status') IS NULL");
                });
            } else {
                $query->where(function ($q) use ($filters) {
                    $q->whereNotNull('variables')
                        ->where('variables', '!=', '')
                        ->whereRaw("JSON_VALID(variables) = 1")
                        ->whereRaw("JSON_EXTRACT(variables, '$.domoprime_status') = ?", [$filters['domoprime_status']]);
                });
            }
        }

        // Text LIKE search filters (sidebar free-text fields)
        $textSearchFields = ['acces_1', 'acces_2', 'source', 'rapport_installation', 'rapport_attribution', 'rapport_temps', 'rapport_admin'];
        foreach ($textSearchFields as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, 'LIKE', '%' . $filters[$field] . '%');
            }
        }

        // Reference search
        if (! empty($filters['reference'])) {
            $query->where('reference', 'LIKE', '%' . $filters['reference'] . '%');
        }

        // Customer name / reference search
        if (! empty($filters['search_lastname'])) {
            $search = $filters['search_lastname'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', fn ($cq) => $cq
                    ->where('lastname', 'LIKE', "%{$search}%")
                    ->orWhere('firstname', 'LIKE', "%{$search}%")
                    ->orWhere('company', 'LIKE', "%{$search}%")
                )->orWhere('reference', 'LIKE', "%{$search}%");
            });
        }

        // Phone search
        if (! empty($filters['search_phone'])) {
            $phone = $filters['search_phone'];
            $query->whereHas('customer', fn ($q) => $q
                ->where('phone', 'LIKE', "%{$phone}%")
                ->orWhere('mobile', 'LIKE', "%{$phone}%"));
        }

        // City search
        if (! empty($filters['search_city'])) {
            $query->whereHas('customer.addresses', fn ($q) => $q->where('city', 'LIKE', "%{$filters['search_city']}%"));
        }

        // ID search
        if (! empty($filters['search_id'])) {
            $query->where('id', $filters['search_id']);
        }

        // Postcode starts-with (supports multiple values)
        if (! empty($filters['postcode'])) {
            $postcodes = is_array($filters['postcode']) ? $filters['postcode'] : [$filters['postcode']];
            $query->whereHas('customer.addresses', fn ($q) => $q->where(function ($sq) use ($postcodes) {
                foreach ($postcodes as $pc) {
                    $sq->orWhere('postcode', 'LIKE', $pc . '%');
                }
            }));
        }

        // IN filters (multiple values)
        $inFilters = [
            'in_telepro_id' => 'telepro_id', 'in_sale_1_id' => 'sale_1_id',
            'in_sale_2_id' => 'sale_2_id', 'in_assistant_id' => 'assistant_id',
            'in_state_id' => 'state_id', 'in_install_state_id' => 'install_state_id',
            'in_admin_status_id' => 'admin_status_id', 'in_opc_status_id' => 'opc_status_id',
            'in_time_state_id' => 'time_state_id', 'in_team_id' => 'team_id',
            'in_financial_partner_id' => 'financial_partner_id', 'in_partner_layer_id' => 'partner_layer_id',
            'in_polluter_id' => 'polluter_id', 'in_company_id' => 'company_id',
            'in_campaign_id' => 'campaign_id', 'in_created_by_id' => 'created_by_id',
            'in_installer_user_id' => 'installer_user_id',
            'in_opc_range_id' => 'opc_range_id', 'in_sav_at_range_id' => 'sav_at_range_id',
        ];
        foreach ($inFilters as $filterKey => $column) {
            if (! empty($filters[$filterKey])) {
                $values = is_array($filters[$filterKey]) ? $filters[$filterKey] : explode(',', $filters[$filterKey]);
                $query->whereIn($column, $values);
            }
        }

        // IN for product_id (via relation)
        if (! empty($filters['in_product_id'])) {
            $productIds = is_array($filters['in_product_id']) ? $filters['in_product_id'] : explode(',', $filters['in_product_id']);
            $query->whereHas('products', fn ($q) => $q->whereIn('product_id', $productIds));
        }

        // Date range filters
        foreach (['opened_at', 'opc_at', 'sav_at', 'signed_at', 'created_at', 'payment_at'] as $field) {
            $this->applyDateRange($query, $filters, $field);
        }

        // Unified date filter with multi-type support (Symfony sidebar checkboxes)
        // date_type can be a single value or comma-separated for multiple columns (OR logic)
        if (! empty($filters['date_from']) || ! empty($filters['date_to']) || ! empty($filters['date_null'])) {
            $validDateTypes = ['opened_at', 'created_at', 'opc_at', 'sav_at', 'quoted_at'];
            $rawTypes = $filters['date_type'] ?? 'opened_at';
            $dateTypes = array_filter(
                array_map('trim', explode(',', $rawTypes)),
                fn ($t) => in_array($t, $validDateTypes)
            );
            if (empty($dateTypes)) {
                $dateTypes = ['opened_at'];
            }

            if (! empty($filters['date_null'])) {
                // NULL check on any of the selected date columns (OR)
                $query->where(function ($q) use ($dateTypes) {
                    foreach ($dateTypes as $i => $col) {
                        $i === 0 ? $q->whereNull($col) : $q->orWhereNull($col);
                    }
                });
            } else {
                $from = null;
                $to = null;
                if (! empty($filters['date_from'])) {
                    $from = $filters['date_from'];
                    if (strlen($from) === 10) {
                        $from .= ' 00:00:00';
                    }
                }
                if (! empty($filters['date_to'])) {
                    $to = $filters['date_to'];
                    if (strlen($to) === 10) {
                        $to .= ' 23:59:59';
                    }
                }

                if (count($dateTypes) === 1) {
                    // Single column — simple WHERE
                    $col = $dateTypes[0];
                    if ($from) {
                        $query->where($col, '>=', $from);
                    }
                    if ($to) {
                        $query->where($col, '<=', $to);
                    }
                } else {
                    // Multiple columns — OR logic: match if ANY column is in range
                    $query->where(function ($q) use ($dateTypes, $from, $to) {
                        foreach ($dateTypes as $col) {
                            $q->orWhere(function ($sq) use ($col, $from, $to) {
                                if ($from) {
                                    $sq->where($col, '>=', $from);
                                }
                                if ($to) {
                                    $sq->where($col, '<=', $to);
                                }
                            });
                        }
                    });
                }
            }
        }

        // Zone filter (Symfony lines 542-573, via t_customers_contracts_zone postcodes)
        if (! empty($filters['zone_id'])) {
            $zonePostcodes = DB::table('t_customers_contracts_zone')
                ->where('id', $filters['zone_id'])
                ->value('postcodes');

            if ($zonePostcodes) {
                $postcodeList = array_filter(array_map('trim', explode(',', $zonePostcodes)));
                if (! empty($postcodeList)) {
                    $query->whereHas('customer.addresses', fn ($q) => $q->where(function ($sq) use ($postcodeList) {
                        foreach ($postcodeList as $pc) {
                            $sq->orWhere('postcode', 'LIKE', $pc . '%');
                        }
                    }));
                }
            }
        }

        // Quotation is_signed filter (Symfony lines 105-110, via t_domoprime_quotation)
        if (! empty($filters['quotation_is_signed'])) {
            if ($filters['quotation_is_signed'] === 'IS_NULL') {
                $query->whereDoesntHave('domoprimeQuotation');
            } else {
                $query->whereHas('domoprimeQuotation', fn ($q) => $q
                    ->where('is_signed', $filters['quotation_is_signed'])
                    ->where('is_last', 'YES'));
            }
        }

        // Document is_signed filter (Symfony lines 111-116, via t_domoprime_yousign_meeting_document_form)
        if (! empty($filters['document_is_signed'])) {
            if ($filters['document_is_signed'] === 'IS_NULL') {
                $query->whereDoesntHave('domoprimeDocumentForm');
            } else {
                $query->whereHas('domoprimeDocumentForm', fn ($q) => $q
                    ->where('is_signed', $filters['document_is_signed'])
                    ->where('is_last', 'YES'));
            }
        }

        // Energy filter (Symfony lines 78-83, via t_domoprime_calculation)
        if (! empty($filters['energy_id'])) {
            $query->whereHas('domoprimeCalculation', fn ($q) => $q
                ->where('energy_id', $filters['energy_id'])
                ->where('isLast', 'YES'));
        }

        // Sector filter (Symfony lines 84-89, via t_domoprime_calculation)
        if (! empty($filters['sector_id'])) {
            $query->whereHas('domoprimeCalculation', fn ($q) => $q
                ->where('sector_id', $filters['sector_id'])
                ->where('isLast', 'YES'));
        }

        // Class/DPE filter (Symfony lines 90-95, via t_domoprime_calculation)
        if (! empty($filters['class_id'])) {
            $query->whereHas('domoprimeCalculation', fn ($q) => $q
                ->where('class_id', $filters['class_id'])
                ->where('isLast', 'YES'));
        }

        // Surface parcel check (Symfony lines 96-103, checks surface_top != parcel_surface)
        if (! empty($filters['surface_parcel_check'])) {
            $query->whereHas('domoprimeIsoRequest', fn ($q) => $q
                ->whereColumn('surface_top', '!=', 'parcel_surface'));
        }

        // Price range
        if (! empty($filters['price_min'])) {
            $query->where('total_price_with_taxe', '>=', $filters['price_min']);
        }
        if (! empty($filters['price_max'])) {
            $query->where('total_price_with_taxe', '<=', $filters['price_max']);
        }
    }

    /**
     * Apply date range filter.
     * Expects filters like: opened_at_from, opened_at_to
     */
    protected function applyDateRange($query, array $filters, string $field): void
    {
        if (! empty($filters["{$field}_from"])) {
            $from = $filters["{$field}_from"];
            // Add time if not present
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

    /**
     * Apply sorting. Default: opened_at DESC (matching Symfony defaults).
     *
     * Supported sort fields match the Symfony order validators:
     * opened_at, total_price_with_taxe, total_price_without_taxe,
     * lastname (via join), postcode, phone, city, id
     */
    protected function applySorting($query, array $filters): void
    {
        $sortBy = $filters['sort_by'] ?? 'opened_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        // Validate sort order
        if (! in_array($sortOrder, ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        // Fields that sort on the contract table directly
        $directSortFields = [
            'id', 'opened_at', 'opc_at', 'sav_at', 'created_at', 'payment_at',
            'total_price_with_taxe', 'total_price_without_taxe',
        ];

        if (in_array($sortBy, $directSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } elseif ($sortBy === 'lastname') {
            // Sort by customer lastname via subquery
            $query->orderBy(
                \Modules\Customer\Entities\Customer::select('lastname')
                    ->whereColumn('t_customers.id', 't_customers_contract.customer_id')
                    ->limit(1),
                $sortOrder
            );
        } elseif ($sortBy === 'postcode') {
            $query->orderBy(
                \Modules\Customer\Entities\CustomerAddress::select('postcode')
                    ->whereColumn('t_customers_address.customer_id', 't_customers_contract.customer_id')
                    ->where('status', 'ACTIVE')
                    ->limit(1),
                $sortOrder
            );
        } else {
            // Fallback
            $query->orderBy('opened_at', 'desc');
        }
    }

    /**
     * Find contract by ID
     */
    public function find(int $id): ?CustomerContract
    {
        return CustomerContract::find($id);
    }

    /**
     * Find contract with all relations (detail view)
     */
    public function findWithRelations(int $id): ?CustomerContract
    {
        return CustomerContract::with([
            'customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE')->limit(1),
            'telepro:id,firstname,lastname',
            'sale1:id,firstname,lastname',
            'sale2:id,firstname,lastname',
            'assistant:id,firstname,lastname',
            'manager:id,firstname,lastname',
            'creator:id,firstname,lastname',
            'installerUser:id,firstname,lastname',
            'team:id,name',
            'contractStatus.translations',
            'installStatus.translations',
            'adminStatus.translations',
            'opcStatus.translations',
            'timeStatus.translations',
            'financialPartner:id,name',
            'partnerLayer:id,name',
            'polluter:id,name',
            'company:id,name',
            'tax:id,rate',
            'products',
            'history',
            'contributors',
        ])->find($id);
    }

    /**
     * Create a new contract
     */
    public function create(array $data): CustomerContract
    {
        return CustomerContract::create($data);
    }

    /**
     * Update a contract
     */
    public function update(CustomerContract $contract, array $data): CustomerContract
    {
        $contract->update($data);
        $contract->refresh();

        return $contract;
    }

    /**
     * Soft delete a contract (mark as DELETE)
     */
    public function softDelete(CustomerContract $contract): bool
    {
        return $contract->update(['status' => 'DELETE']);
    }

    /**
     * Log contract history
     */
    public function logHistory(CustomerContract $contract, string $message, $user): CustomerContractHistory
    {
        return CustomerContractHistory::create([
            'contract_id' => $contract->id,
            'user_id' => $user->id,
            'user_application' => 'admin',
            'history' => $message,
        ]);
    }

    /**
     * Get contract history
     */
    public function getHistory(int $contractId)
    {
        return CustomerContractHistory::where('contract_id', $contractId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get contract statistics
     */
    public function getStatistics(): array
    {
        return [
            'total_contracts' => CustomerContract::active()->count(),
            'total_signed' => CustomerContract::active()->signed()->count(),
            'total_unsigned' => CustomerContract::active()->signed(false)->count(),
            'total_revenue' => CustomerContract::active()->sum('total_price_with_taxe'),
            'by_status' => CustomerContract::active()
                ->select('state_id', DB::raw('count(*) as count'))
                ->groupBy('state_id')
                ->with('contractStatus')
                ->get(),
            'by_install_status' => CustomerContract::active()
                ->select('install_state_id', DB::raw('count(*) as count'))
                ->whereNotNull('install_state_id')
                ->groupBy('install_state_id')
                ->with('installStatus')
                ->get(),
            'recent_contracts' => CustomerContract::active()
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
        ];
    }

    /**
     * Get filter dropdown options for the contract list.
     * Matches Symfony's CustomerContractsFormFilter choices.
     *
     * @return array<string, array>
     */
    public function getFilterOptions(string $lang = 'fr'): array
    {
        $formatStatus = fn ($collection) => $collection->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->translations->first()?->value ?? $s->name,
        ]);

        $withTranslations = fn ($q) => $q->where('lang', $lang);

        return [
            'contract_statuses' => $formatStatus(
                \Modules\CustomersContracts\Entities\CustomerContractStatus::with(['translations' => $withTranslations])->get()
            ),
            'install_statuses' => $formatStatus(
                \Modules\CustomersContracts\Entities\CustomerContractInstallStatus::with(['translations' => $withTranslations])->get()
            ),
            'admin_statuses' => $formatStatus(
                \Modules\CustomersContracts\Entities\CustomerContractAdminStatus::with(['translations' => $withTranslations])->get()
            ),
            'opc_statuses' => $formatStatus(
                \Modules\CustomersContracts\Entities\CustomerContractOpcStatus::with(['translations' => $withTranslations])->get()
            ),
            'time_statuses' => $formatStatus(
                \Modules\CustomersContracts\Entities\CustomerContractTimeStatus::with(['translations' => $withTranslations])->get()
            ),
            'users' => \Modules\UsersGuard\Entities\User::select('id', 'firstname', 'lastname')
                ->where('is_active', 'YES')
                ->orderBy('lastname')
                ->get()
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => mb_strtoupper(trim($u->lastname . ' ' . $u->firstname)),
                ]),
            'teams' => \Modules\User\Entities\UserTeam::select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($t) => ['id' => $t->id, 'name' => $t->name]),
            'companies' => \Modules\CustomersContracts\Entities\CustomerContractCompany::select('id', 'name')
                ->where('is_active', 'YES')
                ->orderBy('name')
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
            'financial_partners' => \Modules\Partner\Entities\Partner::select('id', 'name')
                ->where('is_active', 'YES')
                ->orderBy('name')
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
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
            'campaigns' => \Modules\CustomersContracts\Entities\CustomerContractCampaign::select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
            'date_ranges' => $formatStatus(
                \Modules\CustomersContracts\Entities\CustomerContractDateRange::with(['translations' => $withTranslations])
                    ->orderBy('from')
                    ->get()
            ),
            'domoprime_statuses' => [
                ['id' => 'IS_NULL', 'name' => 'Non calculé'],
                ['id' => 'ACCEPTED', 'name' => 'ACCEPTÉ'],
                ['id' => 'REFUSED', 'name' => 'REFUSÉ'],
            ],
            'products' => DB::table('t_customers_contract_product')
                ->join('t_products', 't_products.id', '=', 't_customers_contract_product.product_id')
                ->select('t_products.id', 't_products.reference as name')
                ->distinct()
                ->orderBy('t_products.reference')
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
            'zones' => \Modules\CustomersContracts\Entities\CustomerContractZone::select('id', 'name')
                ->where('is_active', 'YES')
                ->orderBy('name')
                ->get()
                ->map(fn ($z) => ['id' => $z->id, 'name' => $z->name]),
            'energies' => $formatStatus(
                \Modules\CustomersContracts\Entities\DomoprimeEnergy::with(['translations' => $withTranslations])->get()
            ),
            'sectors' => \Modules\CustomersContracts\Entities\DomoprimeSector::select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name]),
            'classes' => $formatStatus(
                \Modules\CustomersContracts\Entities\DomoprimeClass::with(['translations' => $withTranslations])->get()
            ),
            'quotation_signed' => [
                ['id' => 'YES', 'name' => 'Oui'],
                ['id' => 'NO', 'name' => 'Non'],
                ['id' => 'IS_NULL', 'name' => 'Aucun devis'],
            ],
            'document_signed' => [
                ['id' => 'YES', 'name' => 'Oui'],
                ['id' => 'NO', 'name' => 'Non'],
                ['id' => 'IS_NULL', 'name' => 'Aucun document'],
            ],
        ];
    }

    /**
     * Generate next contract reference
     */
    public function generateReference(string $prefix = 'CONT'): string
    {
        $lastContract = CustomerContract::orderBy('id', 'desc')->first();
        $nextId = $lastContract ? $lastContract->id + 1 : 1;

        return sprintf('%s-%s-%05d', $prefix, date('Y'), $nextId);
    }
}
