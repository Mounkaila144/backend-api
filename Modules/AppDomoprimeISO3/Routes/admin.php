<?php

use Illuminate\Support\Facades\Route;
use Modules\AppDomoprimeISO3\Http\Controllers\Admin\Iso3ResultsController;
use Modules\AppDomoprimeISO3\Http\Controllers\Admin\Iso3DocumentController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| ISO3 multi-work quotation management endpoints.
| Middleware: tenant + auth:sanctum (applied by prefix group).
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('appdomoprime-iso3')->name('admin.appdomoprime-iso3.')->group(function () {

        // Results for contract view (CUMAC + info block)
        Route::get('/contracts/{contractId}/results', [Iso3ResultsController::class, 'resultsForContract'])
            ->name('contracts.results');

        // Settings & Dates
        // Route::get('/dates', [Iso3SettingsController::class, 'listDates'])->name('dates.index');
        // Route::post('/dates', [Iso3SettingsController::class, 'saveDates'])->name('dates.save');
        // Route::get('/settings', [Iso3SettingsController::class, 'getSettings'])->name('settings.show');
        // Route::put('/settings', [Iso3SettingsController::class, 'updateSettings'])->name('settings.update');

        // Previous Energies (CRUD)
        // Route::get('/previous-energies', [Iso3SettingsController::class, 'listPreviousEnergies'])->name('previous-energies.index');
        // Route::post('/previous-energies', [Iso3SettingsController::class, 'storePreviousEnergy'])->name('previous-energies.store');
        // Route::put('/previous-energies/{id}', [Iso3SettingsController::class, 'updatePreviousEnergy'])->name('previous-energies.update');
        // Route::delete('/previous-energies/{id}', [Iso3SettingsController::class, 'destroyPreviousEnergy'])->name('previous-energies.destroy');

        // Polluter Pricing (sector energy prices + surface coefficients)
        // Route::get('/polluters/{polluterId}/pricing', [Iso3PricingController::class, 'listForPolluter'])->name('pricing.polluter');
        // Route::post('/polluters/{polluterId}/pricing', [Iso3PricingController::class, 'storeForPolluter'])->name('pricing.polluter.store');
        // Route::delete('/pricing/{id}', [Iso3PricingController::class, 'destroy'])->name('pricing.destroy');
        // Route::post('/pricing/{id}/coefficients', [Iso3PricingController::class, 'updateCoefficients'])->name('pricing.coefficients.update');
        // Route::post('/pricing/import', [Iso3PricingController::class, 'importPricing'])->name('pricing.import');
        // Route::post('/pricing/import-surface', [Iso3PricingController::class, 'importSurfacePricing'])->name('pricing.import-surface');
        // Route::get('/pricing/export-cumac-surface', [Iso3PricingController::class, 'exportCumacSurface'])->name('pricing.export-cumac-surface');

        // Quotations for Meeting (API v2 equivalent)
        // Route::get('/quotations/master-products', [Iso3QuotationController::class, 'listMasterProducts'])->name('quotations.master-products');
        // Route::get('/quotations/subvention-types', [Iso3QuotationController::class, 'listSubventionTypes'])->name('quotations.subvention-types');
        // Route::get('/quotations/pricing', [Iso3QuotationController::class, 'listPricing'])->name('quotations.pricing');
        // Route::post('/quotations/meeting', [Iso3QuotationController::class, 'createQuotationMeeting'])->name('quotations.meeting.store');
        // Route::post('/quotations/meeting/auto', [Iso3QuotationController::class, 'autoCreateQuotationMeeting'])->name('quotations.meeting.auto');
        // Route::get('/quotations/{id}', [Iso3QuotationController::class, 'show'])->name('quotations.show');
        // Route::put('/quotations/meeting/{id}', [Iso3QuotationController::class, 'updateQuotationMeeting'])->name('quotations.meeting.update');

        // Quotations for Contract
        // Route::post('/quotations/contract', [Iso3QuotationController::class, 'createQuotationContract'])->name('quotations.contract.store');
        // Route::put('/quotations/contract/{id}', [Iso3QuotationController::class, 'updateQuotationContract'])->name('quotations.contract.update');

        // Results / Simulation
        // Route::post('/quotations/simulate', [Iso3QuotationController::class, 'simulate'])->name('quotations.simulate');
        // Route::get('/quotations/{id}/results', [Iso3QuotationController::class, 'getResults'])->name('quotations.results');

        // Billings & Quotations lists for contract/meeting view
        Route::get('/contracts/{contractId}/billings', [Iso3DocumentController::class, 'listBillings'])->name('contracts.billings');
        Route::get('/contracts/{contractId}/quotations', [Iso3DocumentController::class, 'listQuotations'])->name('contracts.quotations');
        // Route::get('/meetings/{meetingId}/quotations', [Iso3QuotationController::class, 'listMeetingQuotations'])->name('meetings.quotations');

        // PDF Export
        Route::get('/export/quotation/{id}/pdf', [Iso3DocumentController::class, 'exportPdf'])->name('export.pdf');
        Route::get('/export/quotation/{id}/all-pdf', [Iso3DocumentController::class, 'exportAllPdf'])->name('export.all-pdf');
        Route::get('/export/quotation/{id}/signed-pdf', [Iso3DocumentController::class, 'exportSignedPdf'])->name('export.signed-pdf');
    });
});
