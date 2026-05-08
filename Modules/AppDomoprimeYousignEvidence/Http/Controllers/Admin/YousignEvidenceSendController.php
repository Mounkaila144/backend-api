<?php

namespace Modules\AppDomoprimeYousignEvidence\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Phase C scaffolding — endpoints that mutate Yousign state.
 *
 * Each method is currently a stub returning HTTP 501 so the routes are
 * usable from the frontend (allowing UI to enable/disable buttons based
 * on the response) without implementing the API client wiring before
 * credentials are available.
 *
 * When wiring Phase C: inject YousignEvidenceApiClient, SignatureRequestBuilder,
 * resolve the legacy file path for the source PDF, persist the new
 * YousignEvidenceFile row with sign_id, and link the appropriate
 * t_domoprime_yousign_evidence_* row.
 */
class YousignEvidenceSendController extends Controller
{
    public function sendQuotationForSignature(Request $request, int $quotationId): JsonResponse
    {
        return $this->notImplemented('sendQuotationForSignature', ['quotation_id' => $quotationId]);
    }

    public function sendBillingForSignature(Request $request, int $billingId): JsonResponse
    {
        return $this->notImplemented('sendBillingForSignature', ['billing_id' => $billingId]);
    }

    public function sendCompanyDocForSignature(Request $request, int $contractId, int $modelId): JsonResponse
    {
        return $this->notImplemented('sendCompanyDocForSignature', [
            'contract_id' => $contractId,
            'model_id' => $modelId,
        ]);
    }

    public function sendMultiDocumentForSignature(Request $request, int $contractId): JsonResponse
    {
        return $this->notImplemented('sendMultiDocumentForSignature', ['contract_id' => $contractId]);
    }

    public function deleteQuotationSignature(Request $request, int $quotationId): JsonResponse
    {
        return $this->notImplemented('deleteQuotationSignature', ['quotation_id' => $quotationId]);
    }

    public function deleteBillingSignature(Request $request, int $billingId): JsonResponse
    {
        return $this->notImplemented('deleteBillingSignature', ['billing_id' => $billingId]);
    }

    public function deleteCompanyDocSignature(Request $request, int $contractId, int $modelId): JsonResponse
    {
        return $this->notImplemented('deleteCompanyDocSignature', [
            'contract_id' => $contractId,
            'model_id' => $modelId,
        ]);
    }

    private function notImplemented(string $method, array $context): JsonResponse
    {
        return response()->json([
            'success' => false,
            'phase' => 'C',
            'message' => "Phase C scaffold: {$method} requires Yousign API credentials.",
            'context' => $context,
        ], 501);
    }
}
