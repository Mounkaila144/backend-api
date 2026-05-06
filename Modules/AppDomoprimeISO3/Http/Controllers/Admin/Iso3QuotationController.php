<?php

namespace Modules\AppDomoprimeISO3\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationEligibilityChecker;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationEngineFactory;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationFormBuilder;
use Modules\CustomersContracts\Entities\CustomerContract;
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
            'data' => [
                'id' => $quotation->id,
                'reference' => $quotation->reference,
                'cee_prime' => $quotation->cee_prime,
                'qmac_value' => $quotation->qmac_value,
                'total_sale_without_tax' => $quotation->total_sale_without_tax,
                'total_sale_with_tax' => $quotation->total_sale_with_tax,
                'total_tax' => $quotation->total_tax,
                'rest_in_charge' => $quotation->rest_in_charge,
                'is_last' => $quotation->is_last,
            ],
        ]);
    }

    private function loadContractWithPolluter(int $contractId): CustomerContract|JsonResponse
    {
        $contract = CustomerContract::with('polluter')->find($contractId);

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
}
