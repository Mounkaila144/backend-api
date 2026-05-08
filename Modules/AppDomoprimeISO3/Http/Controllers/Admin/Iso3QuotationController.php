<?php

namespace Modules\AppDomoprimeISO3\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProductItem;
use Modules\AppDomoprime\Entities\DomoprimeSubventionType;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationEligibilityChecker;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationEngineFactory;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationFormBuilder;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersMeetings\Entities\CustomerMeeting;
use Throwable;

class Iso3QuotationController extends Controller
{
    public function eligibility(int $contractId, QuotationEligibilityChecker $checker): JsonResponse
    {
        $contract = CustomerContract::with([
            'polluter',
            'domoprimeIsoRequest',
            'customer.addresses',
        ])->find($contractId);

        if (! $contract) {
            return response()->json([
                'eligible' => false,
                'errors' => ['Contract not found'],
            ], 404);
        }

        $result = $checker->check($contract);

        return response()->json([
            'eligible' => $result->eligible,
            'errors' => $result->errors,
        ]);
    }

    public function getNewForm(Request $request, int $contractId, QuotationFormBuilder $formBuilder): JsonResponse
    {
        $contract = CustomerContract::with(['polluter', 'products.product'])->find($contractId);

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found',
            ], 404);
        }

        if (! $contract->polluter) {
            return response()->json([
                'success' => false,
                'message' => 'Contract has no polluter',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $formBuilder->build($contract, $request->query('mode', 'standard'), $request->user()),
        ]);
    }

    public function simulate(Request $request, int $contractId, QuotationEngineFactory $factory): JsonResponse
    {
        $contract = $this->loadContractWithPolluter($contractId);
        if ($contract instanceof JsonResponse) {
            return $contract;
        }

        $payload = $this->validateQuotationPayload($request);

        try {
            $engine = $factory->forPolluterType((string) $contract->polluter->type);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        $result = $engine->simulate($contract, $payload);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function createForContract(Request $request, int $contractId, QuotationEngineFactory $factory): JsonResponse
    {
        $contract = $this->loadContractWithPolluter($contractId);
        if ($contract instanceof JsonResponse) {
            return $contract;
        }

        $payload = $this->validateQuotationPayload($request);

        try {
            $engine = $factory->forPolluterType((string) $contract->polluter->type);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        $userId = (int) (Auth::id() ?? $request->user()?->getKey() ?? 0);
        if ($userId <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Authenticated user required',
            ], 401);
        }

        try {
            $quotation = $engine->create($contract, $payload, $userId);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $this->serializeQuotation($quotation),
        ]);
    }

    // ------------------------------------------------------------------
    // Meeting-side endpoints (Story M0)
    // ------------------------------------------------------------------

    public function getMeetingNewForm(Request $request, int $meetingId, QuotationFormBuilder $formBuilder): JsonResponse
    {
        $meeting = CustomerMeeting::with(['polluter', 'customer.addresses', 'domoprimeRequest'])->find($meetingId);

        if (! $meeting) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting not found',
            ], 404);
        }

        if (! $meeting->polluter) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting has no polluter',
            ], 422);
        }

        if (! $meeting->customer_id) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting has no customer',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $formBuilder->build($meeting, $request->query('mode', 'standard'), $request->user()),
        ]);
    }

    public function simulateForMeeting(Request $request, int $meetingId, QuotationEngineFactory $factory): JsonResponse
    {
        $meeting = $this->loadMeetingWithPolluter($meetingId);
        if ($meeting instanceof JsonResponse) {
            return $meeting;
        }

        $payload = $this->validateQuotationPayload($request);

        try {
            $engine = $factory->forPolluterType((string) $meeting->polluter->type);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        $result = $engine->simulate($meeting, $payload);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function createForMeeting(Request $request, int $meetingId, QuotationEngineFactory $factory): JsonResponse
    {
        $meeting = $this->loadMeetingWithPolluter($meetingId);
        if ($meeting instanceof JsonResponse) {
            return $meeting;
        }

        $payload = $this->validateQuotationPayload($request);

        try {
            $engine = $factory->forPolluterType((string) $meeting->polluter->type);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        $userId = (int) (Auth::id() ?? $request->user()?->getKey() ?? 0);
        if ($userId <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Authenticated user required',
            ], 401);
        }

        try {
            $quotation = $engine->create($meeting, $payload, $userId);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $this->serializeQuotation($quotation),
        ]);
    }

    // ------------------------------------------------------------------
    // Quotation Listing / Show / Update / Lifecycle
    // ------------------------------------------------------------------

    /**
     * List all quotations for a contract.
     */
    public function listQuotations(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::find($contractId);

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found',
            ], 404);
        }

        $quotations = DomoprimeQuotation::where('contract_id', $contractId)
            ->with(['products', 'calculation', 'subventionType', 'creator:id,firstname,lastname'])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'quotations' => $quotations,
                'pagination' => null,
            ],
        ]);
    }

    /**
     * List all quotations for a meeting (via linked contract or directly).
     */
    public function listQuotationsForMeeting(Request $request, int $meetingId): JsonResponse
    {
        $meeting = \Modules\CustomersMeetings\Entities\CustomerMeeting::find($meetingId);

        if (! $meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        // Story M0 added direct meeting_id quotations. We surface both:
        // - quotations attached to the meeting itself
        // - quotations attached to any contract derived from this meeting
        $contractIds = CustomerContract::where('meeting_id', $meetingId)->pluck('id');

        $quotations = DomoprimeQuotation::query()
            ->where(function ($q) use ($meetingId, $contractIds) {
                $q->where('meeting_id', $meetingId);
                if ($contractIds->isNotEmpty()) {
                    $q->orWhereIn('contract_id', $contractIds);
                }
            })
            ->with(['products', 'calculation', 'subventionType', 'creator:id,firstname,lastname'])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'quotations' => $quotations,
                'pagination' => null,
            ],
        ]);
    }

    /**
     * Show a single quotation with products and items (for the edit form).
     */
    public function showQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::with([
            'products.items',
            'calculation',
            'subventionType',
            'creator:id,firstname,lastname',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $quotation,
        ]);
    }

    /**
     * Update a quotation (date, subvention type, product items quantities/prices).
     * Matches Symfony SaveITEQuotation3FromRequestForViewContract action.
     */
    public function updateQuotation(Request $request, int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::with(['products.items'])->findOrFail($id);

        $validated = $request->validate([
            'dated_at'            => 'sometimes|date',
            'subvention_type_id'  => 'sometimes|nullable|integer|exists:t_domoprime_subvention_type,id',
            'discount_amount'     => 'sometimes|numeric|min:0|max:9999999.99',
            'ana_prime'           => 'sometimes|numeric|min:0|max:9999999.99',
            'prime'               => 'sometimes|numeric|min:0|max:9999999.99',
            'items'               => 'sometimes|array',
            'items.*.id'          => 'required_with:items|integer|min:1',
            'items.*.quantity'    => 'sometimes|numeric|min:0|max:999999.999',
            'items.*.sale_price_without_tax' => 'sometimes|numeric|min:0|max:9999999.99',
        ]);

        $allowedTopLevel = ['dated_at', 'subvention_type_id', 'discount_amount', 'ana_prime', 'prime'];
        $updates = array_intersect_key($validated, array_flip($allowedTopLevel));

        if (! empty($updates)) {
            $quotation->update($updates);
        }

        // Update product items (quantities and prices)
        foreach ($validated['items'] ?? [] as $itemData) {
            $item = DomoprimeQuotationProductItem::find($itemData['id']);

            if (! $item || $item->quotation_id !== $quotation->id) {
                continue;
            }

            $itemUpdates = array_intersect_key(
                $itemData,
                array_flip(['quantity', 'sale_price_without_tax'])
            );

            if (! empty($itemUpdates)) {
                $item->update($itemUpdates);
            }
        }

        // Reload and return
        $quotation->refresh();
        $quotation->load(['products.items', 'calculation', 'subventionType', 'creator:id,firstname,lastname']);

        return response()->json([
            'success' => true,
            'data'    => $quotation,
            'message' => 'Quotation updated successfully',
        ]);
    }

    /**
     * Disable a quotation (set status to DELETE).
     */
    public function disableQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);
        $quotation->update(['status' => 'DELETE']);

        return response()->json(['success' => true, 'message' => 'Quotation disabled']);
    }

    /**
     * Enable a quotation (set status to ACTIVE).
     */
    public function enableQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);
        $quotation->update(['status' => 'ACTIVE']);

        return response()->json(['success' => true, 'message' => 'Quotation enabled']);
    }

    /**
     * Permanently delete a quotation and its related products/items.
     */
    public function destroyQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);

        // Delete related items first, then products, then quotation
        $quotation->productItems()->delete();
        $quotation->products()->delete();
        $quotation->delete();

        return response()->json(['success' => true, 'message' => 'Quotation deleted permanently']);
    }

    /**
     * Refresh (regenerate) the quotation reference.
     */
    public function refreshQuotationReference(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);

        $newRef = 'DEV-' . str_pad($quotation->id, 6, '0', STR_PAD_LEFT)
            . '-' . now()->format('mY');

        $quotation->update(['reference' => $newRef]);

        return response()->json([
            'success'   => true,
            'message'   => 'Reference refreshed',
            'reference' => $newRef,
        ]);
    }

    /**
     * List subvention types (for the edit form dropdown).
     */
    public function listSubventionTypes(): JsonResponse
    {
        $types = DomoprimeSubventionType::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $types,
        ]);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function loadContractWithPolluter(int $contractId): CustomerContract|JsonResponse
    {
        $contract = CustomerContract::with(['polluter', 'customer.addresses', 'domoprimeIsoRequest'])->find($contractId);

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found',
            ], 404);
        }

        if (! $contract->polluter) {
            return response()->json([
                'success' => false,
                'message' => 'Contract has no polluter',
            ], 422);
        }

        return $contract;
    }

    private function loadMeetingWithPolluter(int $meetingId): CustomerMeeting|JsonResponse
    {
        $meeting = CustomerMeeting::with(['polluter', 'customer.addresses', 'domoprimeRequest'])->find($meetingId);

        if (! $meeting) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting not found',
            ], 404);
        }

        if (! $meeting->polluter) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting has no polluter',
            ], 422);
        }

        if (! $meeting->customer_id) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting has no customer',
            ], 422);
        }

        return $meeting;
    }

    /**
     * @return array<string, mixed>
     */
    private function validateQuotationPayload(Request $request): array
    {
        return $request->validate([
            'dated_at' => 'nullable|date',
            'subvention_type_id' => 'nullable|integer',
            'tva_rate' => 'nullable|numeric|min:0|max:100',
            // Manuel subvention (Symfony parity).
            'ana_prime_check' => 'nullable|boolean',
            'cee_prime_check' => 'nullable|boolean',
            'discount_check' => 'nullable|boolean',
            'ana_prime' => 'nullable|numeric|min:0',
            'cee_prime' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|integer|min:1',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.price' => 'nullable|numeric|min:0',
            'items.*.name' => 'nullable|string',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeQuotation(\Modules\AppDomoprime\Entities\DomoprimeQuotation $quotation): array
    {
        return [
            'id' => $quotation->id,
            'reference' => $quotation->reference,
            'contract_id' => $quotation->contract_id,
            'meeting_id' => $quotation->meeting_id,
            'cee_prime' => $quotation->cee_prime,
            'qmac_value' => $quotation->qmac_value,
            'total_sale_without_tax' => $quotation->total_sale_without_tax,
            'total_sale_with_tax' => $quotation->total_sale_with_tax,
            'total_tax' => $quotation->total_tax,
            'rest_in_charge' => $quotation->rest_in_charge,
            'is_last' => $quotation->is_last,
        ];
    }
}
