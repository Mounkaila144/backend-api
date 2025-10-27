<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersContracts\Http\Controllers\Admin\ContractController;
use Modules\CustomersContracts\Http\Controllers\Admin\IndexController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('api/admin')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::prefix('customerscontracts')->name('admin.customerscontracts.')->group(function () {
        // Legacy placeholder routes
        Route::get('/legacy', [IndexController::class, 'index'])->name('legacy.index');

        // Main contract routes
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');
        Route::get('/contracts/statistics', [ContractController::class, 'statistics'])->name('contracts.statistics');
        Route::get('/contracts/{id}', [ContractController::class, 'show'])->name('contracts.show');
        Route::put('/contracts/{id}', [ContractController::class, 'update'])->name('contracts.update');
        Route::delete('/contracts/{id}', [ContractController::class, 'destroy'])->name('contracts.destroy');
        Route::get('/contracts/{id}/history', [ContractController::class, 'history'])->name('contracts.history');
    });
});
