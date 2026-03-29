<?php

namespace Modules\CustomersContracts\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Modules\CustomersContracts\Entities\CustomerContractAdminStatus;
use Modules\CustomersContracts\Entities\CustomerContractAdminStatusI18n;
use Modules\CustomersContracts\Entities\CustomerContractCompany;
use Modules\CustomersContracts\Entities\CustomerContractDateRange;
use Modules\CustomersContracts\Entities\CustomerContractDateRangeI18n;
use Modules\CustomersContracts\Entities\CustomerContractInstallStatus;
use Modules\CustomersContracts\Entities\CustomerContractInstallStatusI18n;
use Modules\CustomersContracts\Entities\CustomerContractOpcStatus;
use Modules\CustomersContracts\Entities\CustomerContractOpcStatusI18n;
use Modules\CustomersContracts\Entities\CustomerContractStatus;
use Modules\CustomersContracts\Entities\CustomerContractStatusI18n;
use Modules\CustomersContracts\Entities\CustomerContractTimeStatus;
use Modules\CustomersContracts\Entities\CustomerContractTimeStatusI18n;
use Modules\CustomersContracts\Entities\CustomerContractZone;

class ContractConfigController extends Controller
{
    // ─── Entity mapping ───────────────────────────────────────

    protected array $statusTypes = [
        'statuses' => [
            'model' => CustomerContractStatus::class,
            'i18n' => CustomerContractStatusI18n::class,
            'fk' => 'status_id',
        ],
        'install-statuses' => [
            'model' => CustomerContractInstallStatus::class,
            'i18n' => CustomerContractInstallStatusI18n::class,
            'fk' => 'status_id',
        ],
        'time-statuses' => [
            'model' => CustomerContractTimeStatus::class,
            'i18n' => CustomerContractTimeStatusI18n::class,
            'fk' => 'status_id',
        ],
        'opc-statuses' => [
            'model' => CustomerContractOpcStatus::class,
            'i18n' => CustomerContractOpcStatusI18n::class,
            'fk' => 'status_id',
        ],
        'admin-statuses' => [
            'model' => CustomerContractAdminStatus::class,
            'i18n' => CustomerContractAdminStatusI18n::class,
            'fk' => 'status_id',
        ],
    ];

    // ═══════════════════════════════════════════════════════════
    //  STATUS CRUD (5 types share the same logic)
    // ═══════════════════════════════════════════════════════════

    public function statusIndex(Request $request, string $type): JsonResponse
    {
        $config = $this->resolveStatusType($type);
        if (!$config) {
            return $this->notFoundType($type);
        }

        $lang = $request->query('lang', 'fr');

        $items = $config['model']::with(['translations' => fn ($q) => $q->where('lang', $lang)])
            ->orderBy('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'color' => $item->color,
                'icon' => $item->icon,
                'value' => $item->translations->first()?->value ?? $item->name,
                'translation_id' => $item->translations->first()?->id,
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function statusStore(Request $request, string $type): JsonResponse
    {
        $config = $this->resolveStatusType($type);
        if (!$config) {
            return $this->notFoundType($type);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:64',
            'color' => 'nullable|string|max:16',
            'icon' => 'nullable|string|max:64',
            'lang' => 'required|string|max:2',
            'value' => 'required|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Check duplicate name
        if ($config['model']::where('name', $data['name'])->exists()) {
            return response()->json([
                'success' => false,
                'errors' => ['name' => ['A status with this name already exists.']],
            ], 422);
        }

        $item = $config['model']::create([
            'name' => $data['name'],
            'color' => $data['color'] ?? '',
            'icon' => $data['icon'] ?? '',
        ]);

        $config['i18n']::create([
            $config['fk'] => $item->id,
            'lang' => $data['lang'],
            'value' => $data['value'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status created successfully.',
            'data' => $this->formatStatus($item, $data['lang']),
        ], 201);
    }

    public function statusShow(Request $request, string $type, int $id): JsonResponse
    {
        $config = $this->resolveStatusType($type);
        if (!$config) {
            return $this->notFoundType($type);
        }

        $item = $config['model']::with('translations')->find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $item->id,
                'name' => $item->name,
                'color' => $item->color,
                'icon' => $item->icon,
                'translations' => $item->translations->map(fn ($t) => [
                    'id' => $t->id,
                    'lang' => $t->lang,
                    'value' => $t->value,
                ]),
            ],
        ]);
    }

    public function statusUpdate(Request $request, string $type, int $id): JsonResponse
    {
        $config = $this->resolveStatusType($type);
        if (!$config) {
            return $this->notFoundType($type);
        }

        $item = $config['model']::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:64',
            'color' => 'nullable|string|max:16',
            'icon' => 'nullable|string|max:64',
            'lang' => 'sometimes|string|max:2',
            'value' => 'sometimes|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Check duplicate name (exclude self)
        if (isset($data['name']) && $config['model']::where('name', $data['name'])->where('id', '!=', $id)->exists()) {
            return response()->json([
                'success' => false,
                'errors' => ['name' => ['A status with this name already exists.']],
            ], 422);
        }

        $item->update(array_filter([
            'name' => $data['name'] ?? null,
            'color' => array_key_exists('color', $data) ? $data['color'] : null,
            'icon' => array_key_exists('icon', $data) ? $data['icon'] : null,
        ], fn ($v) => $v !== null));

        // Update or create i18n
        if (isset($data['lang']) && isset($data['value'])) {
            $config['i18n']::updateOrCreate(
                [$config['fk'] => $id, 'lang' => $data['lang']],
                ['value' => $data['value']]
            );
        }

        $lang = $data['lang'] ?? 'fr';

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully.',
            'data' => $this->formatStatus($item->fresh(), $lang),
        ]);
    }

    public function statusDestroy(string $type, int $id): JsonResponse
    {
        $config = $this->resolveStatusType($type);
        if (!$config) {
            return $this->notFoundType($type);
        }

        $item = $config['model']::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        // Delete translations first, then status
        $item->translations()->delete();
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Status deleted successfully.',
            'data' => ['id' => $id],
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    //  RANGE DATE CRUD
    // ═══════════════════════════════════════════════════════════

    public function rangeIndex(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $items = CustomerContractDateRange::with(['translations' => fn ($q) => $q->where('lang', $lang)])
            ->orderBy('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'from' => $item->from,
                'to' => $item->to,
                'color' => $item->color,
                'value' => $item->translations->first()?->value ?? $item->name,
                'translation_id' => $item->translations->first()?->id,
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function rangeStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:64',
            'from' => 'nullable|date_format:H:i',
            'to' => 'nullable|date_format:H:i',
            'color' => 'nullable|string|max:16',
            'lang' => 'required|string|max:2',
            'value' => 'required|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $item = CustomerContractDateRange::create([
            'name' => $data['name'],
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'color' => $data['color'] ?? '',
        ]);

        CustomerContractDateRangeI18n::create([
            'range_id' => $item->id,
            'lang' => $data['lang'],
            'value' => $data['value'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Range created successfully.',
            'data' => $this->formatRange($item->fresh(), $data['lang']),
        ], 201);
    }

    public function rangeShow(Request $request, int $id): JsonResponse
    {
        $item = CustomerContractDateRange::with('translations')->find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $item->id,
                'name' => $item->name,
                'from' => $item->from,
                'to' => $item->to,
                'color' => $item->color,
                'translations' => $item->translations->map(fn ($t) => [
                    'id' => $t->id,
                    'lang' => $t->lang,
                    'value' => $t->value,
                ]),
            ],
        ]);
    }

    public function rangeUpdate(Request $request, int $id): JsonResponse
    {
        $item = CustomerContractDateRange::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:64',
            'from' => 'nullable|date_format:H:i',
            'to' => 'nullable|date_format:H:i',
            'color' => 'nullable|string|max:16',
            'lang' => 'sometimes|string|max:2',
            'value' => 'sometimes|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $item->update(array_filter([
            'name' => $data['name'] ?? null,
            'from' => array_key_exists('from', $data) ? $data['from'] : null,
            'to' => array_key_exists('to', $data) ? $data['to'] : null,
            'color' => array_key_exists('color', $data) ? $data['color'] : null,
        ], fn ($v) => $v !== null));

        if (isset($data['lang']) && isset($data['value'])) {
            CustomerContractDateRangeI18n::updateOrCreate(
                ['range_id' => $id, 'lang' => $data['lang']],
                ['value' => $data['value']]
            );
        }

        $lang = $data['lang'] ?? 'fr';

        return response()->json([
            'success' => true,
            'message' => 'Range updated successfully.',
            'data' => $this->formatRange($item->fresh(), $lang),
        ]);
    }

    public function rangeDestroy(int $id): JsonResponse
    {
        $item = CustomerContractDateRange::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $item->translations()->delete();
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Range deleted successfully.',
            'data' => ['id' => $id],
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    //  ZONE CRUD
    // ═══════════════════════════════════════════════════════════

    public function zoneIndex(Request $request): JsonResponse
    {
        $query = CustomerContractZone::orderBy('id');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('postcodes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->query('is_active'));
        }

        $items = $query->get()->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'postcodes' => $item->postcodes,
            'max_contracts' => $item->max_contracts,
            'is_active' => $item->is_active,
        ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function zoneStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:64',
            'postcodes' => 'nullable|string',
            'max_contracts' => 'nullable|integer|min:0',
            'is_active' => 'nullable|in:YES,NO',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (CustomerContractZone::where('name', $data['name'])->exists()) {
            return response()->json([
                'success' => false,
                'errors' => ['name' => ['A zone with this name already exists.']],
            ], 422);
        }

        $item = CustomerContractZone::create([
            'name' => $data['name'],
            'postcodes' => $data['postcodes'] ?? '',
            'max_contracts' => $data['max_contracts'] ?? 0,
            'is_active' => $data['is_active'] ?? 'NO',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Zone created successfully.',
            'data' => $item,
        ], 201);
    }

    public function zoneUpdate(Request $request, int $id): JsonResponse
    {
        $item = CustomerContractZone::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:64',
            'postcodes' => 'nullable|string',
            'max_contracts' => 'nullable|integer|min:0',
            'is_active' => 'nullable|in:YES,NO',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (isset($data['name']) && CustomerContractZone::where('name', $data['name'])->where('id', '!=', $id)->exists()) {
            return response()->json([
                'success' => false,
                'errors' => ['name' => ['A zone with this name already exists.']],
            ], 422);
        }

        $item->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Zone updated successfully.',
            'data' => $item->fresh(),
        ]);
    }

    public function zoneDestroy(int $id): JsonResponse
    {
        $item = CustomerContractZone::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Zone deleted successfully.',
            'data' => ['id' => $id],
        ]);
    }

    public function zoneToggleActive(int $id): JsonResponse
    {
        $item = CustomerContractZone::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $item->update(['is_active' => $item->is_active === 'YES' ? 'NO' : 'YES']);

        return response()->json([
            'success' => true,
            'message' => 'Zone status toggled.',
            'data' => $item->fresh(),
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    //  COMPANY CRUD
    // ═══════════════════════════════════════════════════════════

    public function companyIndex(Request $request): JsonResponse
    {
        $query = CustomerContractCompany::orderBy('id', 'desc');

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->query('search')}%");
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->query('is_active'));
        }

        $items = $query->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function companyStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), $this->companyRules());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (CustomerContractCompany::where('name', $data['name'])->exists()) {
            return response()->json([
                'success' => false,
                'errors' => ['name' => ['A company with this name already exists.']],
            ], 422);
        }

        $item = CustomerContractCompany::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Company created successfully.',
            'data' => $item,
        ], 201);
    }

    public function companyShow(int $id): JsonResponse
    {
        $item = CustomerContractCompany::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => $item]);
    }

    public function companyUpdate(Request $request, int $id): JsonResponse
    {
        $item = CustomerContractCompany::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $rules = $this->companyRules();
        foreach ($rules as $key => $rule) {
            $rules[$key] = str_replace('required', 'sometimes', $rule);
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (isset($data['name']) && CustomerContractCompany::where('name', $data['name'])->where('id', '!=', $id)->exists()) {
            return response()->json([
                'success' => false,
                'errors' => ['name' => ['A company with this name already exists.']],
            ], 422);
        }

        $item->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully.',
            'data' => $item->fresh(),
        ]);
    }

    public function companyDestroy(int $id): JsonResponse
    {
        $item = CustomerContractCompany::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully.',
            'data' => ['id' => $id],
        ]);
    }

    public function companyToggleActive(int $id): JsonResponse
    {
        $item = CustomerContractCompany::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $item->update(['is_active' => $item->is_active === 'YES' ? 'NO' : 'YES']);

        return response()->json([
            'success' => true,
            'message' => 'Company status toggled.',
            'data' => $item->fresh(),
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════

    protected function resolveStatusType(string $type): ?array
    {
        return $this->statusTypes[$type] ?? null;
    }

    protected function notFoundType(string $type): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => "Unknown configuration type: {$type}",
        ], 404);
    }

    protected function formatStatus($item, string $lang): array
    {
        $item->load(['translations' => fn ($q) => $q->where('lang', $lang)]);

        return [
            'id' => $item->id,
            'name' => $item->name,
            'color' => $item->color,
            'icon' => $item->icon,
            'value' => $item->translations->first()?->value ?? $item->name,
            'translation_id' => $item->translations->first()?->id,
        ];
    }

    protected function formatRange($item, string $lang): array
    {
        $item->load(['translations' => fn ($q) => $q->where('lang', $lang)]);

        return [
            'id' => $item->id,
            'name' => $item->name,
            'from' => $item->from,
            'to' => $item->to,
            'color' => $item->color,
            'value' => $item->translations->first()?->value ?? $item->name,
            'translation_id' => $item->translations->first()?->id,
        ];
    }

    protected function companyRules(): array
    {
        return [
            'name' => 'required|string|max:50',
            'commercial' => 'nullable|string|max:50',
            'siret' => 'nullable|string|max:50',
            'tva' => 'nullable|string|max:50',
            'rcs' => 'nullable|string|max:50',
            'rge' => 'nullable|string|max:50',
            'ape' => 'nullable|string|max:20',
            'capital' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:128',
            'web' => 'nullable|string|max:128',
            'phone' => 'nullable|string|max:20',
            'fax' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'address1' => 'nullable|string|max:128',
            'address2' => 'nullable|string|max:128',
            'postcode' => 'nullable|string|max:10',
            'city' => 'nullable|string|max:64',
            'country' => 'nullable|string|max:2',
            'state' => 'nullable|string|max:64',
            'gender' => 'nullable|in:Mr,Ms,Mrs',
            'firstname' => 'nullable|string|max:64',
            'lastname' => 'nullable|string|max:64',
            'function' => 'nullable|string|max:64',
            'firstname1' => 'nullable|string|max:64',
            'lastname1' => 'nullable|string|max:64',
            'function1' => 'nullable|string|max:64',
            'comments' => 'nullable|string',
            'type' => 'nullable|in:ISO,BOILER,PAC,ITE',
            'is_active' => 'nullable|in:YES,NO',
        ];
    }
}
