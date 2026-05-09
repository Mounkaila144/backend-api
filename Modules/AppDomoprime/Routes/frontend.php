<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/frontend')->middleware(['api', 'tenant', 'block.superadmin.host'])->group(function () {
    Route::prefix('appdomoprime')->name('frontend.appdomoprime.')->group(function () {
        // Routes will be added here as controllers are created
    });
});
