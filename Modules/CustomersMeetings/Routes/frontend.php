<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersMeetings\Http\Controllers\Frontend\IndexController;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE - Public + Protected)
|--------------------------------------------------------------------------
*/

Route::prefix('api/frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('customersmeetings')->name('frontend.customersmeetings.')->group(function () {
        // Public routes
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            // Routes authentifiees ici
        });
    });
});
