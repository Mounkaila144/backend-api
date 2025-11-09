<?php
use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Superadmin\IndexController;
use Modules\UsersGuard\Http\Controllers\Superadmin\AuthController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
*/

// Routes d'authentification (pas de middleware auth)
Route::prefix('superadmin')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
    });
});

// Routes protégées
Route::prefix('superadmin')->middleware(['auth:sanctum'])->group(function () {
    // Auth routes (protégées)
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });

    // Users guard routes
    Route::prefix('usersguard')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
