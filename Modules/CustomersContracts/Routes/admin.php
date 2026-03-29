<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractActionController;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractController;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractSettingsController;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractTabsController;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractConfigController;
use Modules\CustomersContracts\Http\Controllers\Admin\IndexController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('customerscontracts')->name('admin.customerscontracts.')->group(function () {
        // Legacy placeholder routes
        Route::get('/legacy', [IndexController::class, 'index'])->name('legacy.index');

        // Settings
        Route::get('/settings', [ContractSettingsController::class, 'show'])->name('settings.show');
        Route::put('/settings', [ContractSettingsController::class, 'update'])->name('settings.update');
        Route::get('/settings/options', [ContractSettingsController::class, 'options'])->name('settings.options');

        // ─── Configuration CRUD (statuses, ranges, zones, companies) ───
        Route::prefix('config')->name('config.')->group(function () {
            // Generic status CRUD (5 types: statuses, install-statuses, time-statuses, opc-statuses, admin-statuses)
            Route::get('/{type}', [ContractConfigController::class, 'statusIndex'])
                ->where('type', 'statuses|install-statuses|time-statuses|opc-statuses|admin-statuses')
                ->name('status.index');
            Route::post('/{type}', [ContractConfigController::class, 'statusStore'])
                ->where('type', 'statuses|install-statuses|time-statuses|opc-statuses|admin-statuses')
                ->name('status.store');
            Route::get('/{type}/{id}', [ContractConfigController::class, 'statusShow'])
                ->where(['type' => 'statuses|install-statuses|time-statuses|opc-statuses|admin-statuses', 'id' => '[0-9]+'])
                ->name('status.show');
            Route::put('/{type}/{id}', [ContractConfigController::class, 'statusUpdate'])
                ->where(['type' => 'statuses|install-statuses|time-statuses|opc-statuses|admin-statuses', 'id' => '[0-9]+'])
                ->name('status.update');
            Route::delete('/{type}/{id}', [ContractConfigController::class, 'statusDestroy'])
                ->where(['type' => 'statuses|install-statuses|time-statuses|opc-statuses|admin-statuses', 'id' => '[0-9]+'])
                ->name('status.destroy');

            // Range Date CRUD
            Route::get('/ranges', [ContractConfigController::class, 'rangeIndex'])->name('ranges.index');
            Route::post('/ranges', [ContractConfigController::class, 'rangeStore'])->name('ranges.store');
            Route::get('/ranges/{id}', [ContractConfigController::class, 'rangeShow'])->name('ranges.show');
            Route::put('/ranges/{id}', [ContractConfigController::class, 'rangeUpdate'])->name('ranges.update');
            Route::delete('/ranges/{id}', [ContractConfigController::class, 'rangeDestroy'])->name('ranges.destroy');

            // Zone CRUD
            Route::get('/zones', [ContractConfigController::class, 'zoneIndex'])->name('zones.index');
            Route::post('/zones', [ContractConfigController::class, 'zoneStore'])->name('zones.store');
            Route::put('/zones/{id}', [ContractConfigController::class, 'zoneUpdate'])->name('zones.update');
            Route::delete('/zones/{id}', [ContractConfigController::class, 'zoneDestroy'])->name('zones.destroy');
            Route::patch('/zones/{id}/toggle-active', [ContractConfigController::class, 'zoneToggleActive'])->name('zones.toggleActive');

            // Company CRUD
            Route::get('/companies', [ContractConfigController::class, 'companyIndex'])->name('companies.index');
            Route::post('/companies', [ContractConfigController::class, 'companyStore'])->name('companies.store');
            Route::get('/companies/{id}', [ContractConfigController::class, 'companyShow'])->name('companies.show');
            Route::put('/companies/{id}', [ContractConfigController::class, 'companyUpdate'])->name('companies.update');
            Route::delete('/companies/{id}', [ContractConfigController::class, 'companyDestroy'])->name('companies.destroy');
            Route::patch('/companies/{id}/toggle-active', [ContractConfigController::class, 'companyToggleActive'])->name('companies.toggleActive');
        });

        // Main contract routes
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');
        Route::get('/contracts/filter-options', [ContractController::class, 'filterOptions'])->name('contracts.filterOptions');
        Route::get('/contracts/tabs', [ContractController::class, 'tabs'])->name('contracts.tabs');
        Route::get('/contracts/statistics', [ContractController::class, 'statistics'])->name('contracts.statistics');
        Route::get('/contracts/{id}', [ContractController::class, 'show'])->name('contracts.show');
        Route::put('/contracts/{id}', [ContractController::class, 'update'])->name('contracts.update');
        Route::delete('/contracts/{id}', [ContractController::class, 'destroy'])->name('contracts.destroy');
        Route::get('/contracts/{id}/history', [ContractController::class, 'history'])->name('contracts.history');

        // Contract action routes
        Route::prefix('contracts/{id}')->group(function () {
            // State transitions
            Route::patch('/confirm', [ContractActionController::class, 'confirm'])->name('contracts.confirm');
            Route::patch('/unconfirm', [ContractActionController::class, 'unconfirm'])->name('contracts.unconfirm');
            Route::patch('/cancel', [ContractActionController::class, 'cancel'])->name('contracts.cancel');
            Route::patch('/uncancel', [ContractActionController::class, 'uncancel'])->name('contracts.uncancel');
            Route::patch('/blowing', [ContractActionController::class, 'blowing'])->name('contracts.blowing');
            Route::patch('/unblowing', [ContractActionController::class, 'unblowing'])->name('contracts.unblowing');
            Route::patch('/placement', [ContractActionController::class, 'placement'])->name('contracts.placement');
            Route::patch('/unplacement', [ContractActionController::class, 'unplacement'])->name('contracts.unplacement');

            // Hold toggles
            Route::patch('/hold', [ContractActionController::class, 'hold'])->name('contracts.hold');
            Route::patch('/unhold', [ContractActionController::class, 'unhold'])->name('contracts.unhold');
            Route::patch('/hold-admin', [ContractActionController::class, 'holdAdmin'])->name('contracts.holdAdmin');
            Route::patch('/unhold-admin', [ContractActionController::class, 'unholdAdmin'])->name('contracts.unholdAdmin');
            Route::patch('/hold-quote', [ContractActionController::class, 'holdQuote'])->name('contracts.holdQuote');
            Route::patch('/unhold-quote', [ContractActionController::class, 'unholdQuote'])->name('contracts.unholdQuote');

            // Copy & Products
            Route::post('/copy', [ContractActionController::class, 'copy'])->name('contracts.copy');
            Route::post('/create-default-products', [ContractActionController::class, 'createDefaultProducts'])->name('contracts.createDefaultProducts');

            // Recycle & Toggle
            Route::patch('/recycle', [ContractActionController::class, 'recycle'])->name('contracts.recycle');
            Route::patch('/toggle-field', [ContractActionController::class, 'toggleField'])->name('contracts.toggleField');

            // Communication
            Route::post('/send-sms', [ContractActionController::class, 'sendSms'])->name('contracts.sendSms');
            Route::post('/send-email', [ContractActionController::class, 'sendEmail'])->name('contracts.sendEmail');

            // Comments
            Route::post('/comments', [ContractActionController::class, 'addComment'])->name('contracts.addComment');

            // Tab data endpoints
            Route::get('/products', [ContractTabsController::class, 'products'])->name('contracts.tab.products');
            Route::get('/tab-comments', [ContractTabsController::class, 'comments'])->name('contracts.tab.comments');
            Route::post('/tab-comments', [ContractTabsController::class, 'storeComment'])->name('contracts.tab.comments.store');
            Route::delete('/tab-comments/{commentId}', [ContractTabsController::class, 'deleteComment'])->name('contracts.tab.comments.delete');
            Route::get('/emails', [ContractTabsController::class, 'emails'])->name('contracts.tab.emails');
            Route::get('/sms', [ContractTabsController::class, 'sms'])->name('contracts.tab.sms');
            Route::get('/documents', [ContractTabsController::class, 'documents'])->name('contracts.tab.documents');
            Route::get('/installations', [ContractTabsController::class, 'installations'])->name('contracts.tab.installations');
            Route::get('/localisation', [ContractTabsController::class, 'localisation'])->name('contracts.tab.localisation');
            Route::get('/billing', [ContractTabsController::class, 'billing'])->name('contracts.tab.billing');
            Route::get('/whatsapp', [ContractTabsController::class, 'whatsapp'])->name('contracts.tab.whatsapp');
            Route::get('/partner-whatsapp', [ContractTabsController::class, 'partnerWhatsapp'])->name('contracts.tab.partnerWhatsapp');
            Route::get('/doc-check', [ContractTabsController::class, 'docCheck'])->name('contracts.tab.docCheck');
            Route::get('/steps', [ContractTabsController::class, 'steps'])->name('contracts.tab.steps');
            Route::get('/requests', [ContractTabsController::class, 'requests'])->name('contracts.tab.requests');
            Route::get('/assets', [ContractTabsController::class, 'assets'])->name('contracts.tab.assets');
            Route::put('/steps/{participant}', [ContractTabsController::class, 'saveStep'])->name('contracts.tab.steps.save');
            Route::post('/doc-check/upload', [ContractTabsController::class, 'docCheckUpload'])->name('contracts.tab.docCheck.upload');
            Route::get('/doc-check/files/{fileId}/download', [ContractTabsController::class, 'docCheckDownloadFile'])->name('contracts.tab.docCheck.downloadFile');
            Route::delete('/doc-check/files/{fileId}', [ContractTabsController::class, 'docCheckDeleteFile'])->name('contracts.tab.docCheck.deleteFile');
            Route::patch('/doc-check/files/{fileId}/disable', [ContractTabsController::class, 'docCheckDisableFile'])->name('contracts.tab.docCheck.disableFile');
            Route::patch('/doc-check/files/{fileId}/enable', [ContractTabsController::class, 'docCheckEnableFile'])->name('contracts.tab.docCheck.enableFile');
            Route::get('/attributions', [ContractTabsController::class, 'attributions'])->name('contracts.tab.attributions');
            Route::get('/attributions/edit', [ContractTabsController::class, 'attributionsEdit'])->name('contracts.tab.attributions.edit');
            Route::put('/attributions', [ContractTabsController::class, 'saveAttributions'])->name('contracts.tab.attributions.save');
        });
    });
});
