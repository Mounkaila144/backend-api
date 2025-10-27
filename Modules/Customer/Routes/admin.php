<?php

use Illuminate\Support\Facades\Route;
use Modules\Customer\Http\Controllers\Admin\CustomerController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de donnÃ©es du tenant
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('customers')->name('admin.customers.')->group(function () {
        // Customer CRUD
        Route::get('/', [CustomerController::class, 'index'])->name('index');
        Route::post('/', [CustomerController::class, 'store'])->name('store');
        Route::get('/stats', [CustomerController::class, 'stats'])->name('stats');
        Route::get('/{id}', [CustomerController::class, 'show'])->name('show');
        Route::put('/{id}', [CustomerController::class, 'update'])->name('update');
        Route::delete('/{id}', [CustomerController::class, 'destroy'])->name('destroy');
    });
});
