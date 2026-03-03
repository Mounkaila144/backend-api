<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('appdomoprime-iso3')->name('superadmin.appdomoprime-iso3.')->group(function () {
        // Routes will be added here as controllers are created
    });
});
