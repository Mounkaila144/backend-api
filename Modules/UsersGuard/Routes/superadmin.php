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
// 'api' middleware group brings EnsureFrontendRequestsAreStateful for SPA session/CSRF.
Route::prefix('api/superadmin')->middleware(['api', 'superadmin.host'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
    });
});

// Routes protégées
Route::prefix('api/superadmin')->middleware(['api', 'auth:sanctum', 'superadmin.host'])->group(function () {
    // Auth routes (protégées)
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        // /auth/refresh removed — Sanctum SPA sessions auto-extend on activity (config/session.php).
    });

    // Users guard routes
    Route::prefix('usersguard')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
