<?php

use Illuminate\Support\Facades\Route;
use Modules\Customer\Http\Controllers\Superadmin\IndexController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de donnÃ©es centrale
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('customer')->name('superadmin.customer.')->group(function () {
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::post('/', [IndexController::class, 'store'])->name('store');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');
        Route::put('/{id}', [IndexController::class, 'update'])->name('update');
        Route::delete('/{id}', [IndexController::class, 'destroy'])->name('destroy');
    });
});