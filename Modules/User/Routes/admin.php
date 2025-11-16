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

// Routes globales admin (authentification + tenant requis)
Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {

    // User management routes - Symfony 1 style credentials
    Route::prefix('users')->name('admin.users.')->group(function () {

        // Statistics - accessible par admin, superadmin, ou users avec permission settings_user
        Route::get('/statistics', [UserController::class, 'statistics'])
            ->middleware('credential:admin,superadmin,settings_user')
            ->name('statistics');

        // Creation options - get available groups, functions, profiles, etc.
        // Accessible avec les mêmes permissions que la liste des utilisateurs
        Route::get('/creation-options', [UserController::class, 'creationOptions'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('creation-options');

        // List users - logique OR: au moins un de ces credentials
        Route::get('/', [UserController::class, 'index'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('index');

        // Create user - logique OR
        Route::post('/', [UserController::class, 'store'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('store');

        // View user - logique OR
        Route::get('/{id}', [UserController::class, 'show'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('show');

        // Update user - logique OR
        Route::put('/{id}', [UserController::class, 'update'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('update');

        Route::patch('/{id}', [UserController::class, 'update'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('patch');

        // Delete user - logique OR
        Route::delete('/{id}', [UserController::class, 'destroy'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('destroy');
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
