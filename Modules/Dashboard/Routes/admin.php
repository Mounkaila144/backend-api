<?php

use Illuminate\Support\Facades\Route;
use Modules\Dashboard\Http\Controllers\Admin\IndexController;
use Modules\Dashboard\Http\Controllers\Admin\MenuController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('dashboard')->name('admin.dashboard.')->group(function () {
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::post('/', [IndexController::class, 'store'])->name('store');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');
        Route::put('/{id}', [IndexController::class, 'update'])->name('update');
        Route::delete('/{id}', [IndexController::class, 'destroy'])->name('destroy');
    });

    // Menu Management Routes
    Route::prefix('menus')->name('admin.menus.')->group(function () {
        // Tree and list views
        Route::get('/tree', [MenuController::class, 'tree'])->name('tree');
        Route::get('/', [MenuController::class, 'index'])->name('index');

        // Special operations
        Route::post('/rebuild', [MenuController::class, 'rebuild'])->name('rebuild');
        Route::get('/by-name/{name}', [MenuController::class, 'byName'])->name('byName');

        // CRUD operations
        Route::post('/', [MenuController::class, 'store'])->name('store');
        Route::get('/{id}', [MenuController::class, 'show'])->name('show');
        Route::put('/{id}', [MenuController::class, 'update'])->name('update');
        Route::delete('/{id}', [MenuController::class, 'destroy'])->name('destroy');

        // Menu specific operations
        Route::get('/{id}/children', [MenuController::class, 'children'])->name('children');
        Route::post('/{id}/move', [MenuController::class, 'move'])->name('move');
        Route::delete('/{id}/hard', [MenuController::class, 'hardDestroy'])->name('hardDestroy');
    });
});
