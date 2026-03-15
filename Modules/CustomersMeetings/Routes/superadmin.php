<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersMeetings\Http\Controllers\Superadmin\IndexController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('customersmeetings')->name('superadmin.customersmeetings.')->group(function () {
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::post('/', [IndexController::class, 'store'])->name('store');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');
        Route::put('/{id}', [IndexController::class, 'update'])->name('update');
        Route::delete('/{id}', [IndexController::class, 'destroy'])->name('destroy');
    });
});
