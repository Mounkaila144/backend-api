<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('appdomoprime-iso3')->name('frontend.appdomoprime-iso3.')->group(function () {
        // Routes will be added here as controllers are created
    });
});
