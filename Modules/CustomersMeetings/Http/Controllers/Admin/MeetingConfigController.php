<?php

namespace Modules\CustomersMeetings\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Modules\CustomersMeetings\Entities\CustomerMeetingCampaign;
use Modules\CustomersMeetings\Entities\CustomerMeetingDateRange;
use Modules\CustomersMeetings\Entities\CustomerMeetingDateRangeI18n;
use Modules\CustomersMeetings\Entities\CustomerMeetingStatus;
use Modules\CustomersMeetings\Entities\CustomerMeetingStatusCall;
use Modules\CustomersMeetings\Entities\CustomerMeetingStatusCallI18n;
use Modules\CustomersMeetings\Entities\CustomerMeetingStatusI18n;
use Modules\CustomersMeetings\Entities\CustomerMeetingStatusLead;
use Modules\CustomersMeetings\Entities\CustomerMeetingStatusLeadI18n;
use Modules\CustomersMeetings\Entities\CustomerMeetingType;
use Modules\CustomersMeetings\Entities\CustomerMeetingTypeI18n;

class MeetingConfigController extends Controller
{
    // ─── Entity mapping ───────────────────────────────────────

    protected array $statusTypes = [
        'statuses' => [
            'model' => CustomerMeetingStatus::class,
            'i18n' => CustomerMeetingStatusI18n::class,
            'fk' => 'status_id',
        ],
        'status-calls' => [
            'model' => CustomerMeetingStatusCall::class,
            'i18n' => CustomerMeetingStatusCallI18n::class,
            'fk' => 'status_id',
        ],
        'status-leads' => [
            'model' => CustomerMeetingStatusLead::class,
            'i18n' => CustomerMeetingStatusLeadI18n::class,
            'fk' => 'status_id',
        ],
    ];

    // ═══════════════════════════════════════════════════════════
    //  STATUS CRUD (3 types: status, status-call, status-lead)
    //  All have: name, color, icon + i18n
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
            'data' => $this->formatStatus($item, $data['lang'], $config),
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
            'data' => $this->formatStatus($item->fresh(), $lang, $config),
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

        $item->translations()->delete();
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Status deleted successfully.',
            'data' => ['id' => $id],
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    //  TYPE CRUD (name only + i18n)
    // ═══════════════════════════════════════════════════════════

    public function typeIndex(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $items = CustomerMeetingType::with(['translations' => fn ($q) => $q->where('lang', $lang)])
            ->orderBy('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'value' => $item->translations->first()?->value ?? $item->name,
                'translation_id' => $item->translations->first()?->id,
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function typeStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:64',
            'lang' => 'required|string|max:2',
            'value' => 'required|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (CustomerMeetingType::where('name', $data['name'])->exists()) {
            return response()->json([
                'success' => false,
                'errors' => ['name' => ['A type with this name already exists.']],
            ], 422);
        }

        $item = CustomerMeetingType::create(['name' => $data['name']]);

        CustomerMeetingTypeI18n::create([
            'type_id' => $item->id,
            'lang' => $data['lang'],
            'value' => $data['value'],
        ]);

        $item->load(['translations' => fn ($q) => $q->where('lang', $data['lang'])]);

        return response()->json([
            'success' => true,
            'message' => 'Type created successfully.',
            'data' => [
                'id' => $item->id,
                'name' => $item->name,
                'value' => $item->translations->first()?->value ?? $item->name,
                'translation_id' => $item->translations->first()?->id,
            ],
        ], 201);
    }

    public function typeUpdate(Request $request, int $id): JsonResponse
    {
        $item = CustomerMeetingType::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:64',
            'lang' => 'sometimes|string|max:2',
            'value' => 'sometimes|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (isset($data['name'])) {
            if (CustomerMeetingType::where('name', $data['name'])->where('id', '!=', $id)->exists()) {
                return response()->json([
                    'success' => false,
                    'errors' => ['name' => ['A type with this name already exists.']],
                ], 422);
            }
            $item->update(['name' => $data['name']]);
        }

        if (isset($data['lang']) && isset($data['value'])) {
            CustomerMeetingTypeI18n::updateOrCreate(
                ['type_id' => $id, 'lang' => $data['lang']],
                ['value' => $data['value']]
            );
        }

        $lang = $data['lang'] ?? 'fr';
        $item->load(['translations' => fn ($q) => $q->where('lang', $lang)]);

        return response()->json([
            'success' => true,
            'message' => 'Type updated successfully.',
            'data' => [
                'id' => $item->id,
                'name' => $item->name,
                'value' => $item->translations->first()?->value ?? $item->name,
                'translation_id' => $item->translations->first()?->id,
            ],
        ]);
    }

    public function typeDestroy(int $id): JsonResponse
    {
        $item = CustomerMeetingType::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $item->translations()->delete();
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Type deleted successfully.',
            'data' => ['id' => $id],
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    //  CAMPAIGN CRUD (name only, NO i18n)
    // ═══════════════════════════════════════════════════════════

    public function campaignIndex(Request $request): JsonResponse
    {
        $items = CustomerMeetingCampaign::orderBy('id')->get()->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
        ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function campaignStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $item = CustomerMeetingCampaign::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Campaign created successfully.',
            'data' => ['id' => $item->id, 'name' => $item->name],
        ], 201);
    }

    public function campaignUpdate(Request $request, int $id): JsonResponse
    {
        $item = CustomerMeetingCampaign::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:64',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $item->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Campaign updated successfully.',
            'data' => ['id' => $item->id, 'name' => $item->name],
        ]);
    }

    public function campaignDestroy(int $id): JsonResponse
    {
        $item = CustomerMeetingCampaign::find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Campaign deleted successfully.',
            'data' => ['id' => $id],
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    //  RANGE DATE CRUD (name, from, to, color + i18n)
    // ═══════════════════════════════════════════════════════════

    public function rangeIndex(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $items = CustomerMeetingDateRange::with(['translations' => fn ($q) => $q->where('lang', $lang)])
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

        $item = CustomerMeetingDateRange::create([
            'name' => $data['name'],
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'color' => $data['color'] ?? '',
        ]);

        CustomerMeetingDateRangeI18n::create([
            'range_id' => $item->id,
            'lang' => $data['lang'],
            'value' => $data['value'],
        ]);

        $item->load(['translations' => fn ($q) => $q->where('lang', $data['lang'])]);

        return response()->json([
            'success' => true,
            'message' => 'Range created successfully.',
            'data' => [
                'id' => $item->id,
                'name' => $item->name,
                'from' => $item->from,
                'to' => $item->to,
                'color' => $item->color,
                'value' => $item->translations->first()?->value ?? $item->name,
                'translation_id' => $item->translations->first()?->id,
            ],
        ], 201);
    }

    public function rangeUpdate(Request $request, int $id): JsonResponse
    {
        $item = CustomerMeetingDateRange::find($id);
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
            CustomerMeetingDateRangeI18n::updateOrCreate(
                ['range_id' => $id, 'lang' => $data['lang']],
                ['value' => $data['value']]
            );
        }

        $lang = $data['lang'] ?? 'fr';
        $item->load(['translations' => fn ($q) => $q->where('lang', $lang)]);

        return response()->json([
            'success' => true,
            'message' => 'Range updated successfully.',
            'data' => [
                'id' => $item->id,
                'name' => $item->name,
                'from' => $item->from,
                'to' => $item->to,
                'color' => $item->color,
                'value' => $item->translations->first()?->value ?? $item->name,
                'translation_id' => $item->translations->first()?->id,
            ],
        ]);
    }

    public function rangeDestroy(int $id): JsonResponse
    {
        $item = CustomerMeetingDateRange::find($id);
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

    protected function formatStatus($item, string $lang, array $config): array
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
}
