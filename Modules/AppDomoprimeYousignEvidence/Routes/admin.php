<?php

use Illuminate\Support\Facades\Route;
use Modules\AppDomoprimeYousignEvidence\Http\Controllers\Admin\YousignEvidenceController;
use Modules\AppDomoprimeYousignEvidence\Http\Controllers\Admin\YousignEvidenceExportController;
use Modules\AppDomoprimeYousignEvidence\Http\Controllers\Admin\YousignEvidenceSendController;

/*
|--------------------------------------------------------------------------
| Yousign Evidence — Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Phase A endpoints (read-only) are immediately functional against the
| existing Symfony-populated tables. Phase C endpoints (send, delete) are
| scaffolded but return 501 until the API client is wired up.
| Middleware: tenant + auth:sanctum.
*/

Route::prefix('api/admin')->middleware(['api', 'tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('appdomoprime-yousign-evidence')->name('admin.yousign-evidence.')->group(function () {

        // ---- Phase A — Read-only signature status ----

        Route::get('/quotations/{quotationId}/signature-status', [YousignEvidenceController::class, 'getQuotationSignatureStatus'])
            ->name('quotations.signature-status');

        Route::get('/billings/{billingId}/signature-status', [YousignEvidenceController::class, 'getBillingSignatureStatus'])
            ->name('billings.signature-status');

        Route::get('/contracts/{contractId}/company-documents/{modelId}/signature-status', [YousignEvidenceController::class, 'getCompanyDocSignatureStatus'])
            ->name('contracts.company-doc.signature-status');

        Route::get('/contracts/{contractId}/signatures', [YousignEvidenceController::class, 'listForContract'])
            ->name('contracts.signatures');

        // ---- Phase A — Download signed PDFs (already in DB) ----

        Route::get('/quotations/{quotationId}/signed-pdf', [YousignEvidenceExportController::class, 'exportSignedQuotationPdf'])
            ->name('quotations.signed-pdf');

        Route::get('/billings/{billingId}/signed-pdf', [YousignEvidenceExportController::class, 'exportSignedBillingPdf'])
            ->name('billings.signed-pdf');

        Route::get('/contracts/{contractId}/company-documents/{modelId}/signed-pdf', [YousignEvidenceExportController::class, 'exportSignedCompanyDocPdf'])
            ->name('contracts.company-doc.signed-pdf');

        // ---- Phase C — Send for signature (scaffolded — returns 501 until API client wired) ----

        Route::post('/quotations/{quotationId}/send-for-signature', [YousignEvidenceSendController::class, 'sendQuotationForSignature'])
            ->name('quotations.send-for-signature');

        Route::post('/billings/{billingId}/send-for-signature', [YousignEvidenceSendController::class, 'sendBillingForSignature'])
            ->name('billings.send-for-signature');

        Route::post('/contracts/{contractId}/company-documents/{modelId}/send-for-signature', [YousignEvidenceSendController::class, 'sendCompanyDocForSignature'])
            ->name('contracts.company-doc.send-for-signature');

        Route::post('/contracts/{contractId}/multi-document/send-for-signature', [YousignEvidenceSendController::class, 'sendMultiDocumentForSignature'])
            ->name('contracts.multi-document.send-for-signature');

        // ---- Phase C — Delete signature (scaffolded) ----

        Route::delete('/quotations/{quotationId}/signature', [YousignEvidenceSendController::class, 'deleteQuotationSignature'])
            ->name('quotations.signature.delete');

        Route::delete('/billings/{billingId}/signature', [YousignEvidenceSendController::class, 'deleteBillingSignature'])
            ->name('billings.signature.delete');

        Route::delete('/contracts/{contractId}/company-documents/{modelId}/signature', [YousignEvidenceSendController::class, 'deleteCompanyDocSignature'])
            ->name('contracts.company-doc.signature.delete');
    });
});
