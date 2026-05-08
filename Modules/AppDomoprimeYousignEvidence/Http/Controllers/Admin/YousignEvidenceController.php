<?php

namespace Modules\AppDomoprimeYousignEvidence\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceBilling;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceCompanyDocument;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceFile;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceQuotation;

/**
 * Read-only signature status endpoints (Phase A).
 *
 * These expose the current signature state from the legacy Symfony tables
 * without calling the Yousign API. They become useful immediately because
 * many contracts already have signatures created by the Symfony app.
 *
 * Symfony equivalents:
 *   /app_domoprime_yousign_evidence/DocumentSignatureIteForViewContract
 *   /app_domoprime_yousign_evidence/DocumentSignatureBillingIteForViewContract
 *   /app_domoprime_yousign_evidence/linkCompanyDocumentForViewContract
 */
class YousignEvidenceController extends Controller
{
    public function getQuotationSignatureStatus(Request $request, int $quotationId): JsonResponse
    {
        $link = YousignEvidenceQuotation::with('file')
            ->where('quotation_id', $quotationId)
            ->where('is_last', 'YES')
            ->orderByDesc('id')
            ->first();

        if (! $link) {
            return response()->json([
                'success' => true,
                'data' => $this->emptyStatus(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $this->serializeStatus($link->file, [
                'link_id' => $link->id,
                'quotation_id' => $link->quotation_id,
                'contract_id' => $link->contract_id,
                'created_at' => $link->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function getBillingSignatureStatus(Request $request, int $billingId): JsonResponse
    {
        $link = YousignEvidenceBilling::with('file')
            ->where('billing_id', $billingId)
            ->where('is_last', 'YES')
            ->orderByDesc('id')
            ->first();

        if (! $link) {
            return response()->json([
                'success' => true,
                'data' => $this->emptyStatus(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $this->serializeStatus($link->file, [
                'link_id' => $link->id,
                'billing_id' => $link->billing_id,
                'contract_id' => $link->contract_id,
                'created_at' => $link->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function getCompanyDocSignatureStatus(Request $request, int $contractId, int $modelId): JsonResponse
    {
        $link = YousignEvidenceCompanyDocument::with('file')
            ->where('contract_id', $contractId)
            ->where('model_id', $modelId)
            ->where('is_last', 'YES')
            ->orderByDesc('id')
            ->first();

        if (! $link) {
            return response()->json([
                'success' => true,
                'data' => $this->emptyStatus(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $this->serializeStatus($link->file, [
                'link_id' => $link->id,
                'model_id' => $link->model_id,
                'contract_id' => $link->contract_id,
                'created_at' => $link->created_at?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Aggregate view: all signatures attached to a contract (quotations,
     * billings, company documents). Used by the "signatures dashboard" panel
     * in the contract edit screen.
     */
    public function listForContract(Request $request, int $contractId): JsonResponse
    {
        $quotations = YousignEvidenceQuotation::with('file')
            ->where('contract_id', $contractId)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($l) => array_merge(
                $this->serializeStatus($l->file, [
                    'link_id' => $l->id,
                    'quotation_id' => $l->quotation_id,
                    'is_last' => $l->is_last === 'YES',
                ]),
                ['kind' => 'quotation']
            ));

        $billings = YousignEvidenceBilling::with('file')
            ->where('contract_id', $contractId)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($l) => array_merge(
                $this->serializeStatus($l->file, [
                    'link_id' => $l->id,
                    'billing_id' => $l->billing_id,
                    'is_last' => $l->is_last === 'YES',
                ]),
                ['kind' => 'billing']
            ));

        $companyDocs = YousignEvidenceCompanyDocument::with('file')
            ->where('contract_id', $contractId)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($l) => array_merge(
                $this->serializeStatus($l->file, [
                    'link_id' => $l->id,
                    'model_id' => $l->model_id,
                    'is_last' => $l->is_last === 'YES',
                ]),
                ['kind' => 'company_document']
            ));

        return response()->json([
            'success' => true,
            'data' => [
                'quotations' => $quotations,
                'billings' => $billings,
                'company_documents' => $companyDocs,
            ],
        ]);
    }

    private function emptyStatus(): array
    {
        return [
            'has_signature' => false,
            'is_signed' => false,
            'signed_at' => null,
            'state' => null,
            'status' => null,
            'signer' => null,
        ];
    }

    /**
     * Build the canonical status payload from a YousignEvidenceFile row.
     * Used by all 3 single-resource endpoints + the aggregate endpoint.
     */
    private function serializeStatus(?YousignEvidenceFile $file, array $extras = []): array
    {
        if (! $file) {
            return array_merge($this->emptyStatus(), $extras);
        }

        return array_merge([
            'has_signature' => true,
            'sign_id' => $file->id,
            'is_signed' => $file->isSigned(),
            'is_initiator' => $file->isInitiator(),
            'signed_at' => $file->getSignedAtIso(),
            'state' => $file->state ?: null,
            'status' => $file->status ?: null,
            'errors' => $file->errors ?: null,
            'filename' => $file->filename,
            'batch' => $file->batch,
            'signer' => [
                'firstname' => $file->firstname ?: null,
                'lastname' => $file->lastname ?: null,
                'email' => $file->email ?: null,
                'phone' => $file->phone ?: null,
            ],
            'procedure_id' => $file->id_procedure ?: null,
        ], $extras);
    }
}
