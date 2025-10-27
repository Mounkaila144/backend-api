<?php

use Illuminate\Support\Facades\Route;
use Modules\Dashboard\Http\Controllers\Superadmin\IndexController;
use Modules\Dashboard\Http\Controllers\Superadmin\MenuController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('dashboard')->name('superadmin.dashboard.')->group(function () {
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::post('/', [IndexController::class, 'store'])->name('store');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');
        Route::put('/{id}', [IndexController::class, 'update'])->name('update');
        Route::delete('/{id}', [IndexController::class, 'destroy'])->name('destroy');
    });

    // Menu Management Routes (Superadmin)
    Route::prefix('menus')->name('superadmin.menus.')->group(function () {
        // Tree and list views
        Route::get('/tree', [MenuController::class, 'tree'])->name('tree');
        Route::get('/', [MenuController::class, 'index'])->name('index');

        // Special operations
        Route::get('/metadata', [MenuController::class, 'metadata'])->name('metadata');
        Route::post('/rebuild', [MenuController::class, 'rebuild'])->name('rebuild');

        // CRUD operations
        Route::post('/', [MenuController::class, 'store'])->name('store');
        Route::get('/{id}', [MenuController::class, 'show'])->name('show');
        Route::put('/{id}', [MenuController::class, 'update'])->name('update');
        Route::delete('/{id}', [MenuController::class, 'destroy'])->name('destroy');

        // Menu specific operations
        Route::post('/{id}/move', [MenuController::class, 'move'])->name('move');
        Route::delete('/{id}/hard', [MenuController::class, 'hardDestroy'])->name('hardDestroy');
    });
});
