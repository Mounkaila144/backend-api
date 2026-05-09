<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/superadmin')->middleware(['api', 'auth:sanctum', 'superadmin.host'])->group(function () {
    Route::prefix('appdomoprime')->name('superadmin.appdomoprime.')->group(function () {
        // Routes will be added here as controllers are created
    });
});
