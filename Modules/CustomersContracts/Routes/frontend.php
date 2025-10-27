<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersContracts\Http\Controllers\Frontend\IndexController;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE - Public + Protected)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('api/frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('customerscontracts')->name('frontend.customerscontracts.')->group(function () {
        // Public routes
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            // Routes authentifiées ici
        });
    });
});