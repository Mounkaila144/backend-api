<?php

namespace Modules\AppDomoprimeYousignEvidence\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceBilling;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceCompanyDocument;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceQuotation;
use Modules\AppDomoprimeYousignEvidence\Services\SignedDocumentResolver;

/**
 * Phase A — download signed PDFs that already exist locally / in cloud
 * storage. The Symfony app stores signed copies under
 * sites/{site}/frontend/data/yousign_evidence/... and the same convention
 * is preserved here so files written by the legacy app remain readable.
 *
 * If no local copy exists yet, Phase D's SignatureStatusSyncer will fetch
 * the signed PDF from Yousign and persist it. Until then, this controller
 * returns 404 for unsigned/unfetched documents.
 */
class YousignEvidenceExportController extends Controller
{
    public function exportSignedQuotationPdf(Request $request, int $quotationId, SignedDocumentResolver $resolver)
    {
        $link = YousignEvidenceQuotation::with('file')
            ->where('quotation_id', $quotationId)
            ->where('is_last', 'YES')
            ->orderByDesc('id')
            ->first();

        return $resolver->respondWithSignedFile(
            $link?->file,
            "devis-signe-{$quotationId}.pdf"
        );
    }

    public function exportSignedBillingPdf(Request $request, int $billingId, SignedDocumentResolver $resolver)
    {
        $link = YousignEvidenceBilling::with('file')
            ->where('billing_id', $billingId)
            ->where('is_last', 'YES')
            ->orderByDesc('id')
            ->first();

        return $resolver->respondWithSignedFile(
            $link?->file,
            "facture-signee-{$billingId}.pdf"
        );
    }

    public function exportSignedCompanyDocPdf(Request $request, int $contractId, int $modelId, SignedDocumentResolver $resolver)
    {
        $link = YousignEvidenceCompanyDocument::with('file')
            ->where('contract_id', $contractId)
            ->where('model_id', $modelId)
            ->where('is_last', 'YES')
            ->orderByDesc('id')
            ->first();

        return $resolver->respondWithSignedFile(
            $link?->file,
            "document-signe-{$contractId}-{$modelId}.pdf"
        );
    }
}
