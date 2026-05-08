<?php

namespace Modules\AppDomoprimeISO3\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\CustomersContracts\Entities\CustomerContract;

/**
 * Company-level document metadata for ISO3 contracts:
 * lists available company document models (used by the company-models picker)
 * and reports per-model signature status from t_domoprime_yousign_evidence_company_document.
 *
 * The actual PDF streaming for a model lives in {@see Iso3ExportController::exportCompanyModelPdf}.
 */
class Iso3CompanyModelController extends Controller
{
    /**
     * List company document models for the contract's site company.
     * Equivalent to Symfony /site_company_document/documentIteForViewContract.
     *
     * Joins t_site_company_model with t_site_company_model_i18n (current locale).
     */
    public function listCompanyModels(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::find($contractId);
        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Contract not found'], 404);
        }

        $lang = $request->user()?->language ?? app()->getLocale() ?? 'fr';

        $rows = \DB::connection('tenant')
            ->table('t_site_company_model as m')
            ->leftJoin('t_site_company_model_i18n as i18n', function ($join) use ($lang) {
                $join->on('i18n.model_id', '=', 'm.id')->where('i18n.lang', '=', $lang);
            })
            ->select([
                'm.id',
                'm.name',
                'm.extension',
                'm.company_id',
                'i18n.value',
                'i18n.file',
            ])
            ->orderBy('i18n.value', 'asc')
            ->get();

        $models = $rows->map(fn ($r) => [
            'id'      => (int) $r->id,
            'name'    => $r->name,
            'value'   => $r->value ?? $r->name,
            'fileUrl' => $r->file
                ? "/api/admin/appdomoprime-iso3/contracts/{$contractId}/company-models/{$r->id}/export"
                : null,
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['models' => $models],
        ]);
    }

    /**
     * List company document signatures for the contract.
     * Equivalent to Symfony /app_domoprime_yousign_evidence/linkCompanyDocumentForViewContract.
     *
     * Returns one row per company model with the signature status from
     * t_domoprime_yousign_evidence_company_document for this contract.
     */
    public function listCompanyDocSignatures(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::find($contractId);
        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Contract not found'], 404);
        }

        $lang = $request->user()?->language ?? app()->getLocale() ?? 'fr';

        $models = \DB::connection('tenant')
            ->table('t_site_company_model as m')
            ->leftJoin('t_site_company_model_i18n as i18n', function ($join) use ($lang) {
                $join->on('i18n.model_id', '=', 'm.id')->where('i18n.lang', '=', $lang);
            })
            ->leftJoin('t_domoprime_yousign_evidence_company_document as sig', function ($join) use ($contractId) {
                $join->on('sig.model_id', '=', 'm.id')->where('sig.contract_id', '=', $contractId);
            })
            ->leftJoin('t_services_yousign_evidence_file as file', 'file.id', '=', 'sig.sign_id')
            ->select([
                'm.id',
                'm.name',
                'i18n.value',
                'sig.id as signature_id',
                'file.is_signed',
                'file.signed_at',
            ])
            ->orderBy('i18n.value', 'asc')
            ->get();

        $documents = $models->map(function ($r) {
            $isSigned = ($r->is_signed ?? null) === 'YES';
            $signedAt = $r->signed_at ?? null;
            $hasValidDate = $isSigned && ! empty($signedAt) && $signedAt !== '0000-00-00 00:00:00';

            return [
                'id'        => (int) $r->id,
                'modelName' => $r->value ?? $r->name,
                'isSigned'  => $isSigned,
                'signedAt'  => $hasValidDate ? $signedAt : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => ['documents' => $documents],
        ]);
    }
}
