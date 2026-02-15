<?php

use Illuminate\Support\Facades\Route;
use Modules\Site\Http\Controllers\Superadmin\SiteController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('sites')->name('superadmin.sites.')->group(function () {
        // Statistiques (avant les routes avec paramètre)
        Route::get('statistics', [SiteController::class, 'statistics'])->name('statistics');

        // Actions de masse
        Route::post('toggle-availability', [SiteController::class, 'toggleAvailability'])->name('toggle-availability');

        // CRUD standard
        Route::get('/', [SiteController::class, 'index'])->name('index');
        Route::post('/', [SiteController::class, 'store'])->name('store');
        Route::get('{id}', [SiteController::class, 'show'])->name('show');
        Route::put('{id}', [SiteController::class, 'update'])->name('update');
        Route::delete('{id}', [SiteController::class, 'destroy'])->name('destroy');

        // Actions spécifiques
        Route::post('{id}/activate', [SiteController::class, 'activate'])->name('activate');
        Route::post('{id}/test-connection', [SiteController::class, 'testConnection'])->name('test-connection');
        Route::post('{id}/update-size', [SiteController::class, 'updateDatabaseSize'])->name('update-size');
    });
});
