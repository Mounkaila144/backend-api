<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\Admin\IndexController;
use Modules\User\Http\Controllers\Admin\UserController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    // User management routes
    Route::prefix('users')->name('admin.users.')->group(function () {
        Route::get('/statistics', [UserController::class, 'statistics'])->name('statistics');
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{id}', [UserController::class, 'show'])->name('show');
        Route::put('/{id}', [UserController::class, 'update'])->name('update');
        Route::patch('/{id}', [UserController::class, 'update'])->name('patch');
        Route::delete('/{id}', [UserController::class, 'destroy'])->name('destroy');
    });

    // Legacy index routes (to be migrated)
    Route::prefix('user')->name('admin.user.')->group(function () {
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::post('/', [IndexController::class, 'store'])->name('store');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');
        Route::put('/{id}', [IndexController::class, 'update'])->name('update');
        Route::delete('/{id}', [IndexController::class, 'destroy'])->name('destroy');
    });
});