<?php

namespace Modules\AppDomoprime\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Modules\AppDomoprime\Entities\DomoprimeAfterWorkModel;
use Modules\AppDomoprime\Entities\DomoprimeAfterWorkModelI18n;
use Modules\AppDomoprime\Entities\DomoprimeAssetModel;
use Modules\AppDomoprime\Entities\DomoprimeAssetModelI18n;
use Modules\AppDomoprime\Entities\DomoprimeBillingModel;
use Modules\AppDomoprime\Entities\DomoprimeBillingModelI18n;
use Modules\AppDomoprime\Entities\DomoprimeClass;
use Modules\AppDomoprime\Entities\DomoprimeClassI18n;
use Modules\AppDomoprime\Entities\DomoprimeClassRegionPrice;
use Modules\AppDomoprime\Entities\DomoprimeEnergy;
use Modules\AppDomoprime\Entities\DomoprimeEnergyI18n;
use Modules\AppDomoprime\Entities\DomoprimePreMeetingModel;
use Modules\AppDomoprime\Entities\DomoprimePreMeetingModelI18n;
use Modules\AppDomoprime\Entities\DomoprimeQuotationModel;
use Modules\AppDomoprime\Entities\DomoprimeQuotationModelI18n;
use Modules\AppDomoprime\Entities\DomoprimeRegion;
use Modules\AppDomoprime\Entities\DomoprimeSector;
use Modules\AppDomoprime\Entities\DomoprimeZone;
use Modules\AppDomoprime\Entities\CustomerMeetingFormDocument;
use Modules\AppDomoprime\Entities\CustomerMeetingFormDocumentField;
use Modules\AppDomoprime\Entities\DomoprimeFormDocumentClass;
use Modules\AppDomoprime\Entities\ProductDocumentModel;
use Modules\AppDomoprime\Services\IsoSettingsService;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

class IsoConfigController extends Controller
{
    // ─── Entity mapping ───────────────────────────────────────────────────────

    protected array $isoTypes = [
        'energies' => [
            'model'       => DomoprimeEnergy::class,
            'i18n'        => DomoprimeEnergyI18n::class,
            'fk'          => 'energy_id',
            'main_rules'  => [
                'type' => 'nullable|string|max:32',
            ],
            'i18n_rules'  => [],
        ],
        'classes' => [
            'model'       => DomoprimeClass::class,
            'i18n'        => DomoprimeClassI18n::class,
            'fk'          => 'class_id',
            'main_rules'  => [
                'coef'          => 'nullable|numeric',
                'color'         => 'nullable|string|max:16',
                'multiple'      => 'nullable|numeric',
                'multiple_floor'=> 'nullable|numeric',
                'multiple_top'  => 'nullable|numeric',
                'multiple_wall' => 'nullable|numeric',
                'subvention'    => 'nullable|numeric',
                'bbc_subvention'=> 'nullable|numeric',
                'coef_prime'    => 'nullable|numeric',
                'prime'         => 'nullable|numeric',
                'pack_prime'    => 'nullable|numeric',
            ],
            'i18n_rules'  => [],
        ],
        'quotation-models' => [
            'model'       => DomoprimeQuotationModel::class,
            'i18n'        => DomoprimeQuotationModelI18n::class,
            'fk'          => 'model_id',
            'main_rules'  => [],
            'i18n_rules'  => [
                'body' => 'nullable|string',
            ],
            'polluter_link_table' => 't_partner_polluter_quotation',
        ],
        'billing-models' => [
            'model'       => DomoprimeBillingModel::class,
            'i18n'        => DomoprimeBillingModelI18n::class,
            'fk'          => 'model_id',
            'main_rules'  => [],
            'i18n_rules'  => [
                'body' => 'nullable|string',
            ],
            'polluter_link_table' => 't_partner_polluter_billing',
        ],
        'asset-models' => [
            'model'       => DomoprimeAssetModel::class,
            'i18n'        => DomoprimeAssetModelI18n::class,
            'fk'          => 'model_id',
            'main_rules'  => [],
            'i18n_rules'  => [
                'body' => 'nullable|string',
            ],
            // No polluter link for asset models
        ],
        'premeeting-models' => [
            'model'       => DomoprimePreMeetingModel::class,
            'i18n'        => DomoprimePreMeetingModelI18n::class,
            'fk'          => 'model_id',
            'main_rules'  => [
                'options' => 'nullable|string',
            ],
            'i18n_rules'  => [
                'content'   => 'nullable|string',
                'file'      => 'nullable|string|max:255',
                'variables' => 'nullable|string',
            ],
            'polluter_link_table' => 't_partner_polluter_pre_meeting',
        ],
        'afterwork-models' => [
            'model'       => DomoprimeAfterWorkModel::class,
            'i18n'        => DomoprimeAfterWorkModelI18n::class,
            'fk'          => 'model_id',
            'main_rules'  => [
                'options' => 'nullable|string',
            ],
            'i18n_rules'  => [
                'content'   => 'nullable|string',
                'file'      => 'nullable|string|max:255',
                'variables' => 'nullable|string',
            ],
            'polluter_link_table' => 't_partner_polluter_after_work',
        ],
    ];

    // ═════════════════════════════════════════════════════════════════════════
    //  INDEX
    // ═════════════════════════════════════════════════════════════════════════

    public function index(Request $request, string $type): JsonResponse
    {
        $config = $this->resolveType($type);
        if (!$config) {
            return $this->unknownType($type);
        }

        $lang = $request->query('lang', 'fr');

        $query = $config['model']::with(['translations' => fn ($q) => $q->where('lang', $lang)]);

        // Search by name (main table) or value (i18n)
        if ($request->filled('name')) {
            $query->where('name', 'like', '%' . $request->query('name') . '%');
        }
        if ($request->filled('value')) {
            $i18nClass = $config['i18n'];
            $i18nTable = (new $i18nClass)->getTable();
            $fk = $config['fk'];
            $query->whereHas('translations', function ($q) use ($request, $lang) {
                $q->where('lang', $lang)
                  ->where('value', 'like', '%' . $request->query('value') . '%');
            });
        }

        // Order
        $orderBy  = $request->query('order_by', 'id');
        $orderDir = strtolower($request->query('order_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        if ($orderBy === 'name') {
            $query->orderBy('name', $orderDir);
        } else {
            $query->orderBy('id', $orderDir);
        }

        $rawItems = $query->get();

        // Preload polluter names (single batched query) for types with a polluter link table
        $pollutersByModel = [];
        if (!empty($config['polluter_link_table']) && $rawItems->isNotEmpty()) {
            $modelIds = $rawItems->pluck('id')->all();
            $rows = \DB::connection('tenant')
                ->table($config['polluter_link_table'] . ' as link')
                ->join('t_partner_polluter_company as p', 'p.id', '=', 'link.polluter_id')
                ->whereIn('link.model_id', $modelIds)
                ->whereNotIn('p.status', ['DELETED'])
                ->select('link.model_id', 'p.name')
                ->orderBy('p.name')
                ->get();
            foreach ($rows as $row) {
                $pollutersByModel[$row->model_id][] = $row->name;
            }
        }

        $items = $rawItems->map(function ($item) use ($config, $pollutersByModel) {
            $base = $this->formatItem($item, $config);
            $base['polluters'] = $pollutersByModel[$item->id] ?? [];
            return $base;
        });

        // Order by i18n value in PHP if requested (since cross-table sort is complex)
        if ($orderBy === 'value') {
            $items = $items->sortBy(
                fn ($i) => $i['value'] ?? '',
                SORT_REGULAR,
                $orderDir === 'desc',
            )->values();
        }

        return response()->json(['success' => true, 'data' => $items]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  STORE
    // ═════════════════════════════════════════════════════════════════════════

    public function store(Request $request, string $type): JsonResponse
    {
        $config = $this->resolveType($type);
        if (!$config) {
            return $this->unknownType($type);
        }

        $rules = array_merge(
            [
                'name'  => 'required|string|max:128',
                'lang'  => 'required|string|max:5',
                'value' => 'required|string|max:255',
            ],
            $config['main_rules'],
            $config['i18n_rules']
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($config['model']::where('name', $data['name'])->exists()) {
            return response()->json([
                'success' => false,
                'errors'  => ['name' => ['An item with this name already exists.']],
            ], 422);
        }

        $mainData = array_merge(
            ['name' => $data['name']],
            array_intersect_key($data, $config['main_rules'])
        );

        $item = $config['model']::create($mainData);

        $i18nData = array_merge(
            [
                $config['fk'] => $item->id,
                'lang'        => $data['lang'],
                'value'       => $data['value'],
            ],
            array_intersect_key($data, $config['i18n_rules'])
        );

        $config['i18n']::create($i18nData);

        $item->load(['translations' => fn ($q) => $q->where('lang', $data['lang'])]);

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully.',
            'data'    => $this->formatItem($item, $config),
        ], 201);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  UPDATE
    // ═════════════════════════════════════════════════════════════════════════

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $config = $this->resolveType($type);
        if (!$config) {
            return $this->unknownType($type);
        }

        $item = $config['model']::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found.'], 404);
        }

        $rules = array_merge(
            [
                'name'  => 'sometimes|string|max:128',
                'lang'  => 'sometimes|string|max:5',
                'value' => 'sometimes|string|max:255',
            ],
            $this->makeNullable($config['main_rules']),
            $this->makeNullable($config['i18n_rules'])
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (
            isset($data['name']) &&
            $config['model']::where('name', $data['name'])->where('id', '!=', $id)->exists()
        ) {
            return response()->json([
                'success' => false,
                'errors'  => ['name' => ['An item with this name already exists.']],
            ], 422);
        }

        $mainData = array_intersect_key($data, array_merge(['name' => ''], $config['main_rules']));
        if ($mainData) {
            $item->update($mainData);
        }

        $lang = $data['lang'] ?? 'fr';

        if (isset($data['lang']) || isset($data['value'])) {
            $i18nData = array_merge(
                ['value' => $data['value'] ?? ''],
                array_intersect_key($data, $config['i18n_rules'])
            );
            $config['i18n']::updateOrCreate(
                [$config['fk'] => $id, 'lang' => $lang],
                $i18nData
            );
        }

        $item->load(['translations' => fn ($q) => $q->where('lang', $lang)]);

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully.',
            'data'    => $this->formatItem($item->fresh(['translations' => fn ($q) => $q->where('lang', $lang)]), $config),
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  DESTROY
    // ═════════════════════════════════════════════════════════════════════════

    public function destroy(string $type, int $id): JsonResponse
    {
        $config = $this->resolveType($type);
        if (!$config) {
            return $this->unknownType($type);
        }

        $item = $config['model']::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found.'], 404);
        }

        $item->translations()->delete();
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully.',
            'data'    => ['id' => $id],
        ]);
    }

    public function bulkDestroy(Request $request, string $type): JsonResponse
    {
        $config = $this->resolveType($type);
        if (!$config) {
            return $this->unknownType($type);
        }

        $validator = Validator::make($request->all(), [
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $ids = $validator->validated()['ids'];

        // Delete translations first (FK constraints)
        $config['i18n']::whereIn($config['fk'], $ids)->delete();
        $deleted = $config['model']::whereIn('id', $ids)->delete();

        return response()->json([
            'success' => true,
            'message' => "{$deleted} item(s) deleted.",
            'data'    => ['ids' => $ids, 'deleted' => $deleted],
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  DOCUMENTS ISO  (t_customers_meetings_forms_documents + class link)
    // ═════════════════════════════════════════════════════════════════════════

    public function documentsIndex(Request $request): JsonResponse
    {
        $query = CustomerMeetingFormDocument::with([
            'documentClass.domoprimeClass.translations' => fn ($q) => $q->where('lang', $request->query('lang', 'fr')),
        ])->orderBy('id');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->query('search') . '%');
        }

        $modelIds = CustomerMeetingFormDocument::pluck('model_id')->unique()->values();
        $models   = ProductDocumentModel::whereIn('id', $modelIds)->pluck('name', 'id');

        $items = $query->get()->map(fn ($doc) => $this->formatDocument($doc, $models));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function documentsOptions(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        return response()->json([
            'success' => true,
            'data'    => [
                'product_models' => ProductDocumentModel::orderBy('name')
                    ->get(['id', 'name', 'extension']),
                'classes' => DomoprimeClass::with(['translations' => fn ($q) => $q->where('lang', $lang)])
                    ->orderBy('id')
                    ->get()
                    ->map(fn ($c) => [
                        'id'   => $c->id,
                        'name' => $c->translations->first()?->value ?? $c->name,
                    ])
                    ->values(),
            ],
        ]);
    }

    public function documentStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:64',
            'model_id' => 'required|integer',
            'class_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data    = $validator->validated();
        $classId = $data['class_id'] ?? null;

        $doc = CustomerMeetingFormDocument::create([
            'name'     => $data['name'],
            'model_id' => $data['model_id'],
            'type'     => $classId ? 1 : 0,
        ]);

        if ($classId) {
            DomoprimeFormDocumentClass::create([
                'form_document_id' => $doc->id,
                'class_id'         => $classId,
            ]);
        }

        $doc->load(['documentClass.domoprimeClass.translations' => fn ($q) => $q->where('lang', 'fr')]);
        $models = ProductDocumentModel::whereIn('id', [$doc->model_id])->pluck('name', 'id');

        return response()->json([
            'success' => true,
            'message' => 'Document created successfully.',
            'data'    => $this->formatDocument($doc, $models),
        ], 201);
    }

    public function documentUpdate(Request $request, int $id): JsonResponse
    {
        $doc = CustomerMeetingFormDocument::find($id);
        if (!$doc) {
            return response()->json(['success' => false, 'message' => 'Document not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'     => 'sometimes|string|max:64',
            'model_id' => 'sometimes|integer',
            'class_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data    = $validator->validated();
        $classId = array_key_exists('class_id', $data) ? $data['class_id'] : 'untouched';

        $updateData = array_filter([
            'name'     => $data['name'] ?? null,
            'model_id' => $data['model_id'] ?? null,
        ], fn ($v) => $v !== null);

        if ($classId !== 'untouched') {
            $updateData['type'] = $classId ? 1 : 0;
        }

        if ($updateData) {
            $doc->update($updateData);
        }

        if ($classId !== 'untouched') {
            if ($classId) {
                DomoprimeFormDocumentClass::updateOrCreate(
                    ['form_document_id' => $id],
                    ['class_id' => $classId]
                );
            } else {
                DomoprimeFormDocumentClass::where('form_document_id', $id)->delete();
            }
        }

        $doc->load(['documentClass.domoprimeClass.translations' => fn ($q) => $q->where('lang', 'fr')]);
        $models = ProductDocumentModel::whereIn('id', [$doc->model_id])->pluck('name', 'id');

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully.',
            'data'    => $this->formatDocument($doc->fresh('documentClass.domoprimeClass.translations'), $models),
        ]);
    }

    public function documentDestroy(int $id): JsonResponse
    {
        $doc = CustomerMeetingFormDocument::find($id);
        if (!$doc) {
            return response()->json(['success' => false, 'message' => 'Document not found.'], 404);
        }

        DomoprimeFormDocumentClass::where('form_document_id', $id)->delete();
        $doc->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatDocument(CustomerMeetingFormDocument $doc, $models): array
    {
        $docClass = $doc->documentClass;
        $class    = $docClass?->domoprimeClass;

        return [
            'id'         => $doc->id,
            'name'       => $doc->name,
            'type'       => $doc->type,
            'model_id'   => $doc->model_id,
            'model_name' => $models[$doc->model_id] ?? null,
            'class_id'   => $docClass?->class_id,
            'class_name' => $class?->translations->first()?->value ?? $class?->name,
            'created_at' => $doc->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  SETTINGS  (DomoprimeSettings.dat — same pattern as ContractSettings)
    // ═════════════════════════════════════════════════════════════════════════

    public function showSettings(): JsonResponse
    {
        $service = app(IsoSettingsService::class);

        return response()->json([
            'success' => true,
            'data'    => $service->all(),
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            // Form field mappings
            'surface_wall_formfield'              => 'nullable|string',
            'surface_floor_formfield'             => 'nullable|string',
            'surface_top_formfield'               => 'nullable|string',
            'energy_formfield'                    => 'nullable|string',
            'number_of_people_formfield'          => 'nullable|string',
            'revenue_formfield'                   => 'nullable|string',
            'owner_formfield'                     => 'nullable|string',
            // Products
            'surface_wall_product'                => 'nullable|integer',
            'surface_floor_product'               => 'nullable|integer',
            'surface_top_product'                 => 'nullable|integer',
            'classic_class'                       => 'nullable|integer',
            // Model IDs
            'quotation_model_id'                  => 'nullable|integer',
            'billing_model_id'                    => 'nullable|integer',
            'asset_model_id'                      => 'nullable|integer',
            'premeeting_model_id'                 => 'nullable|integer',
            'after_work_model_id'                 => 'nullable|integer',
            'billing_email_model_id'              => 'nullable|integer',
            'install_in_progess_status_id'        => 'nullable|integer',
            // Filters (arrays of IDs)
            'energy_filter'                       => 'nullable|array',
            'energy_filter.*'                     => 'nullable|integer',
            'class_filter'                        => 'nullable|array',
            'class_filter.*'                      => 'nullable|integer',
            // Financial
            'rest_in_charge'                      => 'nullable|numeric|min:0',
            'fee_file'                            => 'nullable|numeric|min:0',
            'tax_fee_file'                        => 'nullable|numeric|min:0',
            'pourcentage_advance'                 => 'nullable|numeric|min:0',
            'ana_tax'                             => 'nullable|numeric|min:0',
            'ana_pack_tax'                        => 'nullable|numeric|min:0',
            'sales_limit'                         => 'nullable|integer|min:0',
            // Numeric
            'quotation_shift_for_dated_at'        => 'nullable|integer|min:0',
            'multiple_billings_max'               => 'nullable|integer|min:1',
            // Reference formats
            'quotation_reference_format'          => 'nullable|string|max:128',
            'billing_reference_format'            => 'nullable|string|max:128',
            'asset_reference_format'              => 'nullable|string|max:128',
            // Boolean flags (YES/NO)
            'ah_archivage'                        => 'nullable|in:YES,NO',
            'quotation_archivage'                 => 'nullable|in:YES,NO',
            'billing_archivage'                   => 'nullable|in:YES,NO',
            'multi_documents_archivage'           => 'nullable|in:YES,NO',
            'premeeting_archivage'                => 'nullable|in:YES,NO',
            'verif_archivage'                     => 'nullable|in:YES,NO',
            'signed_verif_archivage'              => 'nullable|in:YES,NO',
            'tax_credit'                          => 'nullable|in:YES,NO',
            'calculation_on_contrat_save'         => 'nullable|in:YES,NO',
            'calculation_on_meeting_save'         => 'nullable|in:YES,NO',
            'quotation_multi_pdf'                 => 'nullable|in:YES,NO',
            // Boolean (PHP bool)
            'coef_multiples'                      => 'nullable|boolean',
            // Engine
            'quotation_engine'                    => 'nullable|string|max:64',
            'cumac_engine'                        => 'nullable|string|max:64',
            'quotation_multi_engine'              => 'nullable|string|max:64',
            // Owner formfield values (theme32a Occupation section, superadmin)
            'owner_1_formfield_value'             => 'nullable|integer',
            'owner_2_formfield_value'             => 'nullable|integer',
            'owner_3_formfield_value'             => 'nullable|integer',
        ]);

        // Dynamic energy fields: energy_<id> -> formfield value (one per known energy)
        $dynamicData = [];
        foreach ($request->all() as $key => $value) {
            if (preg_match('/^energy_\d+$/', $key)) {
                if ($value === null || $value === '' || is_numeric($value)) {
                    $dynamicData[$key] = $value === '' ? null : ($value === null ? null : (int) $value);
                }
            }
        }

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $service = app(IsoSettingsService::class);
        $service->save(array_merge($validator->validated(), $dynamicData));
        $service->refresh();

        return response()->json([
            'success' => true,
            'message' => 'ISO settings saved successfully.',
            'data'    => $service->all(),
        ]);
    }

    public function settingsOptions(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');
        $withTrans = fn ($q) => $q->where('lang', $lang);

        $formatI18n = fn ($collection) => $collection->map(fn ($item) => [
            'id'   => $item->id,
            'name' => $item->translations->first()?->value ?? $item->name,
        ])->values();

        // Contract statuses for "install_in_progess_status_id" (theme32a Report section)
        // Pull from t_customers_contracts_status if the table exists, otherwise empty
        $contractStatuses = [];
        if (\Schema::connection('tenant')->hasTable('t_customers_contracts_status')) {
            $rows = \DB::connection('tenant')
                ->table('t_customers_contracts_status as s')
                ->leftJoin('t_customers_contracts_status_i18n as i', function ($q) use ($lang) {
                    $q->on('i.status_id', '=', 's.id')->where('i.lang', '=', $lang);
                })
                ->orderBy('s.id')
                ->select('s.id', 's.name', 'i.value')
                ->get();
            $contractStatuses = $rows->map(fn ($r) => [
                'id'   => $r->id,
                'name' => $r->value ?? $r->name,
            ])->values()->toArray();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'quotation_models'   => $formatI18n(DomoprimeQuotationModel::with(['translations' => $withTrans])->get()),
                'billing_models'     => $formatI18n(DomoprimeBillingModel::with(['translations' => $withTrans])->get()),
                'asset_models'       => $formatI18n(DomoprimeAssetModel::with(['translations' => $withTrans])->get()),
                'premeeting_models'  => $formatI18n(DomoprimePreMeetingModel::with(['translations' => $withTrans])->get()),
                'afterwork_models'   => $formatI18n(DomoprimeAfterWorkModel::with(['translations' => $withTrans])->get()),
                'energies'           => $formatI18n(DomoprimeEnergy::with(['translations' => $withTrans])->get()),
                'classes'            => $formatI18n(DomoprimeClass::with(['translations' => $withTrans])->get()),
                'contract_statuses'  => $contractStatuses,
            ],
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  POLLUTERS  (no i18n — own CRUD methods)
    // ═════════════════════════════════════════════════════════════════════════

    public function polluters(Request $request): JsonResponse
    {
        $query = PartnerPolluterCompany::query()
            ->where('status', '!=', 'DELETED'); // exclude soft-deleted

        // is_active filter
        $isActive = $request->query('is_active', 'ALL');
        if ($isActive !== 'ALL') {
            $query->where('is_active', $isActive);
        }

        // Per-column search (Symfony FormFilter pattern)
        foreach (['name', 'commercial', 'postcode', 'city', 'phone'] as $col) {
            $val = $request->query($col);
            if ($val !== null && $val !== '') {
                $query->where($col, 'like', "%{$val}%");
            }
        }

        // Generic "search" still supported
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('postcode', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Order
        $orderBy  = $request->query('order_by', 'name');
        $orderDir = strtolower($request->query('order_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        if (in_array($orderBy, ['name', 'commercial', 'postcode', 'city', 'phone', 'is_active', 'is_default', 'type'])) {
            $query->orderBy($orderBy, $orderDir);
        } else {
            $query->orderBy('name');
        }

        $items = $query->get()->map(fn ($p) => $this->formatPolluter($p));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function polluter(int $id): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($id);
        if (!$polluter) {
            return response()->json(['success' => false, 'message' => 'Polluter not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => $polluter]);
    }

    public function polluterStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), $this->polluterRules());
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (PartnerPolluterCompany::where('name', $data['name'])->exists()) {
            return response()->json([
                'success' => false,
                'errors'  => ['name' => ['A polluter with this name already exists.']],
            ], 422);
        }

        $polluter = PartnerPolluterCompany::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Polluter created successfully.',
            'data'    => $this->formatPolluter($polluter),
        ], 201);
    }

    public function polluterUpdate(Request $request, int $id): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($id);
        if (!$polluter) {
            return response()->json(['success' => false, 'message' => 'Polluter not found.'], 404);
        }

        $rules = array_map(
            fn ($r) => str_replace('required|', 'sometimes|', $r),
            $this->polluterRules()
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (
            isset($data['name']) &&
            PartnerPolluterCompany::where('name', $data['name'])->where('id', '!=', $id)->exists()
        ) {
            return response()->json([
                'success' => false,
                'errors'  => ['name' => ['A polluter with this name already exists.']],
            ], 422);
        }

        $polluter->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Polluter updated successfully.',
            'data'    => $this->formatPolluter($polluter->fresh()),
        ]);
    }

    public function polluterDestroy(int $id): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($id);
        if (!$polluter) {
            return response()->json(['success' => false, 'message' => 'Polluter not found.'], 404);
        }

        // Soft delete (status = DELETED) — Symfony "Delete" semantics
        $polluter->update(['status' => 'DELETED']);

        return response()->json([
            'success' => true,
            'message' => 'Polluter deleted successfully.',
            'data'    => ['id' => $id],
        ]);
    }

    public function polluterRemove(int $id): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($id);
        if (!$polluter) {
            return response()->json(['success' => false, 'message' => 'Polluter not found.'], 404);
        }

        // Hard delete — Symfony "Remove" semantics
        $polluter->delete();

        return response()->json([
            'success' => true,
            'message' => 'Polluter removed permanently.',
            'data'    => ['id' => $id],
        ]);
    }

    public function polluterToggleActive(int $id): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($id);
        if (!$polluter) {
            return response()->json(['success' => false, 'message' => 'Polluter not found.'], 404);
        }

        $polluter->update([
            'is_active' => $polluter->is_active === 'YES' ? 'NO' : 'YES',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Polluter active status toggled.',
            'data'    => $this->formatPolluter($polluter->fresh()),
        ]);
    }

    public function polluterImport(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle, 0, ';') ?: [];
        $created = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            $data = @array_combine($headers, $row);
            if (!$data || empty($data['name'])) {
                $skipped++;
                continue;
            }
            if (PartnerPolluterCompany::where('name', $data['name'])->exists()) {
                $skipped++;
                continue;
            }
            PartnerPolluterCompany::create(array_intersect_key($data, array_flip([
                'name', 'commercial', 'ape', 'siret', 'tva', 'email', 'web',
                'mobile', 'phone', 'fax', 'address1', 'address2', 'postcode',
                'city', 'country', 'type',
            ])) + ['is_active' => 'YES', 'is_default' => 'NO', 'status' => 'ACTIVE']);
            $created++;
        }
        fclose($handle);

        return response()->json([
            'success' => true,
            'message' => "Polluters imported: {$created} created, {$skipped} skipped.",
            'data'    => ['created' => $created, 'skipped' => $skipped],
        ]);
    }

    public function polluterExport(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="polluters-' . date('Y-m-d') . '.csv"',
        ];

        $columns = [
            'id', 'name', 'commercial', 'type', 'ape', 'siret', 'tva',
            'email', 'web', 'phone', 'mobile', 'fax',
            'address1', 'address2', 'postcode', 'city', 'country',
            'is_active', 'is_default',
        ];

        return response()->stream(function () use ($columns) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel
            fputcsv($out, $columns, ';');
            PartnerPolluterCompany::orderBy('name')->chunk(200, function ($rows) use ($out, $columns) {
                foreach ($rows as $r) {
                    $line = [];
                    foreach ($columns as $c) {
                        $line[] = $r->{$c};
                    }
                    fputcsv($out, $line, ';');
                }
            });
            fclose($out);
        }, 200, $headers);
    }

    public function polluterExportOne(int $id): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($id);
        if (!$polluter) {
            return response()->json(['success' => false, 'message' => 'Polluter not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->formatPolluter($polluter),
        ]);
    }

    protected function formatPolluter(PartnerPolluterCompany $p): array
    {
        return [
            'id'         => $p->id,
            'name'       => $p->name,
            'commercial' => $p->commercial,
            'postcode'   => $p->postcode,
            'city'       => $p->city,
            'phone'      => $p->phone,
            'mobile'     => $p->mobile,
            'email'      => $p->email,
            'is_active'  => $p->is_active,
            'is_default' => $p->is_default,
            'type'       => $p->type,
            'ape'        => $p->ape,
            'siret'      => $p->siret,
            'tva'        => $p->tva,
            'address1'   => $p->address1,
            'address2'   => $p->address2,
            'country'    => $p->country,
            'web'        => $p->web,
            'fax'        => $p->fax,
            'created_at' => $p->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    protected function polluterRules(): array
    {
        return [
            'name'       => 'required|string|max:128',
            'commercial' => 'nullable|string|max:128',
            'ape'        => 'nullable|string|max:10',
            'siret'      => 'nullable|string|max:20',
            'tva'        => 'nullable|string|max:30',
            'logo'       => 'nullable|string|max:255',
            'email'      => 'nullable|email|max:128',
            'web'        => 'nullable|string|max:128',
            'mobile'     => 'nullable|string|max:20',
            'phone'      => 'nullable|string|max:20',
            'fax'        => 'nullable|string|max:20',
            'address1'   => 'nullable|string|max:128',
            'address2'   => 'nullable|string|max:128',
            'postcode'   => 'nullable|string|max:10',
            'city'       => 'nullable|string|max:64',
            'country'    => 'nullable|string|max:2',
            'is_active'  => 'nullable|in:YES,NO',
            'is_default' => 'nullable|in:YES,NO',
            'type'       => 'nullable|string|max:32',
            'status'     => 'nullable|string|max:32',
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ZONES  (no i18n — own CRUD methods)
    // ═════════════════════════════════════════════════════════════════════════

    public function zonesOptions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'regions' => DomoprimeRegion::orderBy('name')->get(['id', 'name']),
                'sectors' => DomoprimeSector::orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }

    public function zonesIndex(Request $request): JsonResponse
    {
        $query = DomoprimeZone::with(['region', 'sectorModel']);

        // Per-column search (Symfony FormFilter pattern)
        foreach (['code', 'dept'] as $col) {
            $val = $request->query($col);
            if ($val !== null && $val !== '') {
                $query->where($col, 'like', "%{$val}%");
            }
        }

        // Generic "search" still supported
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('dept', 'like', "%{$search}%");
            });
        }

        // Order
        $orderBy  = $request->query('order_by', 'id');
        $orderDir = strtolower($request->query('order_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        if (in_array($orderBy, ['id', 'code', 'dept', 'sector_id', 'region_id'])) {
            $query->orderBy($orderBy, $orderDir);
        } else {
            $query->orderBy('id');
        }

        $items = $query->get()->map(fn ($z) => $this->formatZone($z));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function zonesBulkDestroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $ids = $validator->validated()['ids'];
        $deleted = DomoprimeZone::whereIn('id', $ids)->delete();

        return response()->json([
            'success' => true,
            'message' => "{$deleted} zone(s) deleted.",
            'data'    => ['ids' => $ids, 'deleted' => $deleted],
        ]);
    }

    public function zonesStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), $this->zonesRules());
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (DomoprimeZone::where('code', $data['code'])->where('dept', $data['dept'])->exists()) {
            return response()->json([
                'success' => false,
                'errors'  => ['code' => ['A zone with this code/dept combination already exists.']],
            ], 422);
        }

        $zone = DomoprimeZone::create($data);
        $zone->load(['region', 'sectorModel']);

        return response()->json([
            'success' => true,
            'message' => 'Zone created successfully.',
            'data'    => $this->formatZone($zone),
        ], 201);
    }

    public function zonesUpdate(Request $request, int $id): JsonResponse
    {
        $zone = DomoprimeZone::find($id);
        if (!$zone) {
            return response()->json(['success' => false, 'message' => 'Zone not found.'], 404);
        }

        $rules = array_map(
            fn ($r) => str_replace('required|', 'sometimes|', $r),
            $this->zonesRules()
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (
            isset($data['code']) && isset($data['dept']) &&
            DomoprimeZone::where('code', $data['code'])
                ->where('dept', $data['dept'])
                ->where('id', '!=', $id)
                ->exists()
        ) {
            return response()->json([
                'success' => false,
                'errors'  => ['code' => ['A zone with this code/dept combination already exists.']],
            ], 422);
        }

        $zone->update($data);
        $zone->load(['region', 'sectorModel']);

        return response()->json([
            'success' => true,
            'message' => 'Zone updated successfully.',
            'data'    => $this->formatZone($zone->fresh(['region', 'sectorModel'])),
        ]);
    }

    public function zonesDestroy(int $id): JsonResponse
    {
        $zone = DomoprimeZone::find($id);
        if (!$zone) {
            return response()->json(['success' => false, 'message' => 'Zone not found.'], 404);
        }

        $zone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Zone deleted successfully.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatZone(DomoprimeZone $zone): array
    {
        return [
            'id'          => $zone->id,
            'code'        => $zone->code,
            'dept'        => $zone->dept,
            'sector'      => $zone->sector,
            'region_id'   => $zone->region_id,
            'sector_id'   => $zone->sector_id,
            'region_name' => $zone->region?->name,
            'sector_name' => $zone->sectorModel?->name,
        ];
    }

    protected function zonesRules(): array
    {
        return [
            'code'      => 'required|string|max:16',
            'dept'      => 'required|string|max:8',
            'sector'    => 'nullable|string|max:64',
            'region_id' => 'required|integer',
            'sector_id' => 'required|integer',
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  DOCUMENT FIELDS  (dynamic conditions — t_customers_meetings_forms_documents_formfield)
    //  Symfony actions: ListPartialFieldForDocument, NewFieldForDocument,
    //                   ViewFieldForDocument, SaveFieldForDocument,
    //                   DeleteField (customers_meeting_forms_document_ajax)
    // ═════════════════════════════════════════════════════════════════════════

    public function documentFieldsIndex(int $documentId): JsonResponse
    {
        if (!CustomerMeetingFormDocument::where('id', $documentId)->exists()) {
            return response()->json(['success' => false, 'message' => 'Document not found.'], 404);
        }

        $items = CustomerMeetingFormDocumentField::where('document_id', $documentId)
            ->orderBy('id')
            ->get()
            ->map(fn ($f) => $this->formatDocumentField($f));

        return response()->json([
            'success' => true,
            'data'    => ['items' => $items],
        ]);
    }

    public function documentFieldStore(Request $request, int $documentId): JsonResponse
    {
        if (!CustomerMeetingFormDocument::where('id', $documentId)->exists()) {
            return response()->json(['success' => false, 'message' => 'Document not found.'], 404);
        }

        $validator = Validator::make($request->all(), $this->documentFieldRules());
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['document_id'] = $documentId;

        $field = CustomerMeetingFormDocumentField::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Field condition created.',
            'data'    => $this->formatDocumentField($field),
        ], 201);
    }

    public function documentFieldUpdate(Request $request, int $documentId, int $id): JsonResponse
    {
        $field = CustomerMeetingFormDocumentField::where('document_id', $documentId)->find($id);
        if (!$field) {
            return response()->json(['success' => false, 'message' => 'Field not found.'], 404);
        }

        $rules = array_map(
            fn ($r) => is_string($r) ? str_replace('required|', 'sometimes|', $r) : $r,
            $this->documentFieldRules(),
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $field->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Field condition updated.',
            'data'    => $this->formatDocumentField($field->fresh()),
        ]);
    }

    public function documentFieldDestroy(int $documentId, int $id): JsonResponse
    {
        $field = CustomerMeetingFormDocumentField::where('document_id', $documentId)->find($id);
        if (!$field) {
            return response()->json(['success' => false, 'message' => 'Field not found.'], 404);
        }

        $field->delete();

        return response()->json([
            'success' => true,
            'message' => 'Field condition deleted.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatDocumentField(CustomerMeetingFormDocumentField $f): array
    {
        return [
            'id'                => $f->id,
            'document_id'       => $f->document_id,
            'form_id'           => $f->form_id,
            'formfield_id'      => $f->formfield_id,
            'formfield_i18n_id' => $f->formfield_i18n_id,
            'type'              => $f->type,
            'operation'         => $f->operation,
            'value'             => $f->value,
        ];
    }

    protected function documentFieldRules(): array
    {
        return [
            'form_id'           => 'required|integer',
            'formfield_id'      => 'required|integer',
            'formfield_i18n_id' => 'required|integer',
            'type'              => 'nullable|integer',
            'operation'         => 'required|string|max:8',
            'value'             => 'required|string|max:64',
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  CLASS REGION PRICE  (Revenue per region — t_domoprime_class_region_price)
    //  Symfony actions: ListPartialRegionPriceForClass, NewRegionPriceForClass,
    //                   ViewRegionPriceForClass, SaveRegionPriceForClass,
    //                   DeleteRegionPriceForClass
    // ═════════════════════════════════════════════════════════════════════════

    public function classRegionPriceIndex(int $classId): JsonResponse
    {
        if (!DomoprimeClass::where('id', $classId)->exists()) {
            return response()->json(['success' => false, 'message' => 'Class not found.'], 404);
        }

        $items = DomoprimeClassRegionPrice::with('region')
            ->where('class_id', $classId)
            ->orderBy('region_id')
            ->orderBy('number_of_people')
            ->get()
            ->map(fn ($p) => $this->formatClassRegionPrice($p));

        $regions = DomoprimeRegion::orderBy('name')->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'data'    => [
                'items'   => $items,
                'regions' => $regions,
            ],
        ]);
    }

    public function classRegionPriceStore(Request $request, int $classId): JsonResponse
    {
        if (!DomoprimeClass::where('id', $classId)->exists()) {
            return response()->json(['success' => false, 'message' => 'Class not found.'], 404);
        }

        $validator = Validator::make($request->all(), $this->classRegionPriceRules());
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (DomoprimeClassRegionPrice::where('class_id', $classId)
            ->where('region_id', $data['region_id'])
            ->where('number_of_people', $data['number_of_people'])
            ->exists()) {
            return response()->json([
                'success' => false,
                'errors'  => ['region_id' => ['Price already exists for this region/people combination.']],
            ], 422);
        }

        $data['class_id'] = $classId;
        $price = DomoprimeClassRegionPrice::create($data);
        $price->load('region');

        return response()->json([
            'success' => true,
            'message' => 'Region price created.',
            'data'    => $this->formatClassRegionPrice($price),
        ], 201);
    }

    public function classRegionPriceUpdate(Request $request, int $classId, int $id): JsonResponse
    {
        $price = DomoprimeClassRegionPrice::where('class_id', $classId)->find($id);
        if (!$price) {
            return response()->json(['success' => false, 'message' => 'Region price not found.'], 404);
        }

        $rules = array_map(
            fn ($r) => is_string($r) ? str_replace('required|', 'sometimes|', $r) : $r,
            $this->classRegionPriceRules(),
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $price->update($validator->validated());
        $price->load('region');

        return response()->json([
            'success' => true,
            'message' => 'Region price updated.',
            'data'    => $this->formatClassRegionPrice($price->fresh('region')),
        ]);
    }

    public function classRegionPriceDestroy(int $classId, int $id): JsonResponse
    {
        $price = DomoprimeClassRegionPrice::where('class_id', $classId)->find($id);
        if (!$price) {
            return response()->json(['success' => false, 'message' => 'Region price not found.'], 404);
        }

        $price->delete();

        return response()->json([
            'success' => true,
            'message' => 'Region price deleted.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatClassRegionPrice(DomoprimeClassRegionPrice $p): array
    {
        return [
            'id'               => $p->id,
            'class_id'         => $p->class_id,
            'region_id'        => $p->region_id,
            'region_name'      => $p->region?->name,
            'number_of_people' => $p->number_of_people,
            'price'            => $p->price,
        ];
    }

    protected function classRegionPriceRules(): array
    {
        return [
            'region_id'        => 'required|integer',
            'number_of_people' => 'required|integer|min:0',
            'price'            => 'required|numeric|min:0',
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    protected function resolveType(string $type): ?array
    {
        return $this->isoTypes[$type] ?? null;
    }

    protected function unknownType(string $type): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => "Unknown ISO configuration type: {$type}",
        ], 404);
    }

    protected function formatItem($item, array $config): array
    {
        $translation = $item->translations->first();

        $result = [
            'id'             => $item->id,
            'name'           => $item->name,
            'value'          => $translation?->value ?? $item->name,
            'translation_id' => $translation?->id,
        ];

        foreach (array_keys($config['main_rules']) as $field) {
            $result[$field] = $item->{$field};
        }

        foreach (array_keys($config['i18n_rules']) as $field) {
            $result[$field] = $translation?->{$field};
        }

        return $result;
    }

    protected function makeNullable(array $rules): array
    {
        $out = [];
        foreach ($rules as $field => $rule) {
            $out[$field] = preg_replace('/\brequired\b\|?/', '', $rule);
            $out[$field] = ltrim($out[$field], '|');
        }
        return $out;
    }
}
