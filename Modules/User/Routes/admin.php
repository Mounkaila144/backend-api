<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\Admin\IndexController;
use Modules\User\Http\Controllers\Admin\UserController;
use Modules\User\Http\Controllers\Admin\UserPictureController;
use Modules\User\Http\Controllers\Admin\UserSearchController;

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

        // DEBUG: Performance analysis endpoint
        Route::get('/debug-performance', [UserController::class, 'debugPerformance'])
            ->middleware('credential:admin,superadmin')
            ->name('debug-performance');

        // =====================================================================
        // Search routes (Meilisearch)
        // =====================================================================
        Route::prefix('search')->name('search.')->middleware('credential:admin,superadmin,settings_user_list')->group(function () {
            // Full-text search
            Route::get('/', [UserSearchController::class, 'search'])->name('index');
            // Search statistics
            Route::get('/stats', [UserSearchController::class, 'stats'])->name('stats');
            // Reindex all users (admin only)
            Route::post('/reindex', [UserSearchController::class, 'reindex'])
                ->middleware('credential:admin,superadmin')
                ->name('reindex');
            // Configure search index (admin only)
            Route::post('/configure', [UserSearchController::class, 'configure'])
                ->middleware('credential:admin,superadmin')
                ->name('configure');
        });

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
            ->name('show')
            ->where('id', '[0-9]+');

        // Update user - logique OR
        Route::put('/{id}', [UserController::class, 'update'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('update')
            ->where('id', '[0-9]+');

        Route::patch('/{id}', [UserController::class, 'update'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('patch')
            ->where('id', '[0-9]+');

        // Delete user - logique OR
        Route::delete('/{id}', [UserController::class, 'destroy'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('destroy')
            ->where('id', '[0-9]+');

        // =====================================================================
        // User Picture routes (S3/MinIO)
        // =====================================================================
        Route::prefix('{id}/picture')->name('picture.')->where(['id' => '[0-9]+'])->group(function () {
            // Upload picture
            Route::post('/', [UserPictureController::class, 'upload'])
                ->middleware('credential:admin,superadmin,settings_user_list')
                ->name('upload');
            // Get picture URL
            Route::get('/', [UserPictureController::class, 'show'])
                ->middleware('credential:admin,superadmin,settings_user_list')
                ->name('show');
            // Download picture (for local storage)
            Route::get('/download', [UserPictureController::class, 'download'])
                ->middleware('credential:admin,superadmin,settings_user_list')
                ->name('download');
            // Delete picture
            Route::delete('/', [UserPictureController::class, 'destroy'])
                ->middleware('credential:admin,superadmin,settings_user_list')
                ->name('destroy');
        });

        // User storage info
        Route::get('/{id}/storage-info', [UserPictureController::class, 'storageInfo'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('storage-info')
            ->where('id', '[0-9]+');
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
