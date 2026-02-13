<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractActionController;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractController;
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

        // Main contract routes
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');
        Route::get('/contracts/filter-options', [ContractController::class, 'filterOptions'])->name('contracts.filterOptions');
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
        });
    });
});
