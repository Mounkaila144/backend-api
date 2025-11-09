<?php

use Illuminate\Support\Facades\Route;
use Modules\Site\Http\Controllers\Frontend\IndexController;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE - Public + Protected)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de donnÃ©es du tenant
*/

Route::prefix('api/frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('site')->name('frontend.site.')->group(function () {
        // Public routes
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            // Routes authentifiÃ©es ici
        });
    });
});