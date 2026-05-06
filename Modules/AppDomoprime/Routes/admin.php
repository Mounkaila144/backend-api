<?php

use Illuminate\Support\Facades\Route;
use Modules\AppDomoprime\Http\Controllers\Admin\AppDomoprimeController;
use Modules\AppDomoprime\Http\Controllers\Admin\IsoConfigController;
use Modules\AppDomoprime\Http\Controllers\Admin\PolluterSubController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('appdomoprime')->name('admin.appdomoprime.')->group(function () {
        Route::get('/filter-options', [AppDomoprimeController::class, 'filterOptions'])->name('filterOptions');
        Route::get('/iso-requests/contract/{contractId}', [AppDomoprimeController::class, 'getIsoRequestByContract'])->name('isoRequestByContract');
        Route::get('/iso-requests/meeting/{meetingId}', [AppDomoprimeController::class, 'getIsoRequestByMeeting'])->name('isoRequestByMeeting');
        Route::get('/calculations/meeting/{meetingId}', [AppDomoprimeController::class, 'listCalculationsForMeeting'])->name('calculationsForMeeting');

        // ── ISO Configuration CRUD ──────────────────────────────────────────
        // types: energies | classes | quotation-models | billing-models
        //        asset-models | premeeting-models | afterwork-models
        Route::prefix('iso')->name('iso.')->group(function () {
            // Documents ISO (credential: settings_app_domoprime_documents)
            Route::get('/documents/options', [IsoConfigController::class, 'documentsOptions'])->name('documents.options');
            Route::get('/documents', [IsoConfigController::class, 'documentsIndex'])->name('documents.index');
            Route::post('/documents', [IsoConfigController::class, 'documentStore'])->name('documents.store');

            // Document field conditions (dynamic — must be declared before /{id})
            Route::get('/documents/{documentId}/fields', [IsoConfigController::class, 'documentFieldsIndex'])->whereNumber('documentId')->name('documents.fields.index');
            Route::post('/documents/{documentId}/fields', [IsoConfigController::class, 'documentFieldStore'])->whereNumber('documentId')->name('documents.fields.store');
            Route::put('/documents/{documentId}/fields/{id}', [IsoConfigController::class, 'documentFieldUpdate'])->whereNumber('documentId')->whereNumber('id')->name('documents.fields.update');
            Route::delete('/documents/{documentId}/fields/{id}', [IsoConfigController::class, 'documentFieldDestroy'])->whereNumber('documentId')->whereNumber('id')->name('documents.fields.destroy');

            Route::put('/documents/{id}', [IsoConfigController::class, 'documentUpdate'])->whereNumber('id')->name('documents.update');
            Route::delete('/documents/{id}', [IsoConfigController::class, 'documentDestroy'])->whereNumber('id')->name('documents.destroy');

            // Settings (credential: settings_app_domoprime_settings)
            Route::get('/settings/options', [IsoConfigController::class, 'settingsOptions'])->name('settings.options');
            Route::get('/settings', [IsoConfigController::class, 'showSettings'])->name('settings.show');
            Route::put('/settings', [IsoConfigController::class, 'updateSettings'])->name('settings.update');

            // Polluters (credential: settings_app_domoprime_polluters)
            Route::get('/polluters', [IsoConfigController::class, 'polluters'])->name('polluters.index');
            Route::get('/polluters/export', [IsoConfigController::class, 'polluterExport'])->name('polluters.export');
            Route::post('/polluters/import', [IsoConfigController::class, 'polluterImport'])->name('polluters.import');
            Route::get('/polluters/{id}', [IsoConfigController::class, 'polluter'])->whereNumber('id')->name('polluters.show');
            Route::get('/polluters/{id}/export', [IsoConfigController::class, 'polluterExportOne'])->whereNumber('id')->name('polluters.export.one');
            Route::patch('/polluters/{id}/toggle-active', [IsoConfigController::class, 'polluterToggleActive'])->whereNumber('id')->name('polluters.toggleActive');
            Route::post('/polluters', [IsoConfigController::class, 'polluterStore'])->name('polluters.store');
            Route::put('/polluters/{id}', [IsoConfigController::class, 'polluterUpdate'])->whereNumber('id')->name('polluters.update');
            Route::delete('/polluters/{id}', [IsoConfigController::class, 'polluterDestroy'])->whereNumber('id')->name('polluters.destroy');
            Route::delete('/polluters/{id}/remove', [IsoConfigController::class, 'polluterRemove'])->whereNumber('id')->name('polluters.remove');

            // ── Polluter sub-CRUDs (theme32a row actions) ──────────────────
            Route::prefix('polluters/{polluterId}')->whereNumber('polluterId')->name('polluters.')->group(function () {
                // Contacts (credential: app_domoprime_settings_contracts_polluter)
                Route::get('/contacts', [PolluterSubController::class, 'contactsIndex'])->name('contacts.index');
                Route::post('/contacts', [PolluterSubController::class, 'contactStore'])->name('contacts.store');
                Route::put('/contacts/{id}', [PolluterSubController::class, 'contactUpdate'])->whereNumber('id')->name('contacts.update');
                Route::delete('/contacts/{id}', [PolluterSubController::class, 'contactDestroy'])->whereNumber('id')->name('contacts.destroy');

                // Recipient — singleton (credential: app_domoprime_settings_recipient_list_polluter)
                Route::get('/recipient', [PolluterSubController::class, 'recipientShow'])->name('recipient.show');
                Route::put('/recipient', [PolluterSubController::class, 'recipientSave'])->name('recipient.save');

                // Layer — singleton (credential: app_domoprime_settings_layer_list_polluter)
                Route::get('/layer', [PolluterSubController::class, 'layerShow'])->name('layer.show');
                Route::put('/layer', [PolluterSubController::class, 'layerSave'])->name('layer.save');

                // Model selectors — singletons (quotation/billing/premeeting/afterwork)
                // type: quotation|billing|premeeting|afterwork
                Route::get('/model/{type}', [PolluterSubController::class, 'modelShow'])
                    ->whereIn('type', ['quotation', 'billing', 'premeeting', 'afterwork'])
                    ->name('model.show');
                Route::put('/model/{type}', [PolluterSubController::class, 'modelSave'])
                    ->whereIn('type', ['quotation', 'billing', 'premeeting', 'afterwork'])
                    ->name('model.save');

                // Pricing (CUMAC tariff per class — credential: app_domoprime_settings_pricing_list_polluter)
                Route::get('/pricing', [PolluterSubController::class, 'pricingIndex'])->name('pricing.index');
                Route::post('/pricing', [PolluterSubController::class, 'pricingStore'])->name('pricing.store');
                Route::put('/pricing/{id}', [PolluterSubController::class, 'pricingUpdate'])->whereNumber('id')->name('pricing.update');
                Route::delete('/pricing/{id}', [PolluterSubController::class, 'pricingDestroy'])->whereNumber('id')->name('pricing.destroy');

                // Properties (Primes ISO/ISO3 — credential: app_domoprime_settings_properties_list_polluter)
                Route::get('/property', [PolluterSubController::class, 'propertyShow'])->name('property.show');
                Route::put('/property', [PolluterSubController::class, 'propertySave'])->name('property.save');

                // Product (singleton — ISO5 module: ListProductForPolluter / SaveProductForPolluter)
                Route::get('/product', [PolluterSubController::class, 'productShow'])->name('product.show');
                Route::put('/product', [PolluterSubController::class, 'productSave'])->name('product.save');

                // Models I18n (templates — credential: app_domoprime_settings_models_list_polluter)
                Route::get('/models', [PolluterSubController::class, 'modelsIndex'])->name('models.index');
                Route::post('/models', [PolluterSubController::class, 'modelStore'])->name('models.store');
                Route::put('/models/{id}', [PolluterSubController::class, 'modelUpdate'])->whereNumber('id')->name('models.update');
                Route::delete('/models/{id}', [PolluterSubController::class, 'modelDestroy'])->whereNumber('id')->name('models.destroy');

                // Polluter Documents (links — credential: app_domoprime_settings_documents_models_list_polluter)
                Route::get('/documents/options', [PolluterSubController::class, 'polluterDocsOptions'])->name('documents.options');
                Route::get('/documents', [PolluterSubController::class, 'polluterDocsIndex'])->name('documents.index');
                Route::post('/documents', [PolluterSubController::class, 'polluterDocStore'])->name('documents.store');
                Route::put('/documents/{id}', [PolluterSubController::class, 'polluterDocUpdate'])->whereNumber('id')->name('documents.update');
                Route::delete('/documents/{id}', [PolluterSubController::class, 'polluterDocDestroy'])->whereNumber('id')->name('documents.destroy');
            });

            // Zones (specific routes — must be declared before generic /{type})
            Route::get('/zones/options', [IsoConfigController::class, 'zonesOptions'])->name('zones.options');
            Route::get('/zones', [IsoConfigController::class, 'zonesIndex'])->name('zones.index');
            Route::post('/zones', [IsoConfigController::class, 'zonesStore'])->name('zones.store');
            Route::post('/zones/bulk-delete', [IsoConfigController::class, 'zonesBulkDestroy'])->name('zones.bulkDestroy');
            Route::put('/zones/{id}', [IsoConfigController::class, 'zonesUpdate'])->whereNumber('id')->name('zones.update');
            Route::delete('/zones/{id}', [IsoConfigController::class, 'zonesDestroy'])->whereNumber('id')->name('zones.destroy');

            // Class region prices (Revenue per region — credential: app_domoprime_settings_class_pricing)
            Route::get('/classes/{classId}/region-prices', [IsoConfigController::class, 'classRegionPriceIndex'])->whereNumber('classId')->name('classes.regionPrices.index');
            Route::post('/classes/{classId}/region-prices', [IsoConfigController::class, 'classRegionPriceStore'])->whereNumber('classId')->name('classes.regionPrices.store');
            Route::put('/classes/{classId}/region-prices/{id}', [IsoConfigController::class, 'classRegionPriceUpdate'])->whereNumber('classId')->whereNumber('id')->name('classes.regionPrices.update');
            Route::delete('/classes/{classId}/region-prices/{id}', [IsoConfigController::class, 'classRegionPriceDestroy'])->whereNumber('classId')->whereNumber('id')->name('classes.regionPrices.destroy');

            // Generic i18n CRUD (energies | classes | quotation-models | billing-models
            //                    asset-models | premeeting-models | afterwork-models)
            Route::get('/{type}', [IsoConfigController::class, 'index'])->name('index');
            Route::post('/{type}', [IsoConfigController::class, 'store'])->name('store');
            Route::post('/{type}/bulk-delete', [IsoConfigController::class, 'bulkDestroy'])->name('bulkDestroy');
            Route::put('/{type}/{id}', [IsoConfigController::class, 'update'])->whereNumber('id')->name('update');
            Route::delete('/{type}/{id}', [IsoConfigController::class, 'destroy'])->whereNumber('id')->name('destroy');
        });
    });
});
