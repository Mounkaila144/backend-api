<?php
use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Admin\AuthController;
use Modules\UsersGuard\Http\Controllers\Admin\IndexController;
// Public admin routes (tenant context required).
// 'api' middleware group brings EnsureFrontendRequestsAreStateful (Sanctum SPA mode →
// session cookies + CSRF when the request comes from a SANCTUM_STATEFUL_DOMAINS host).
Route::prefix('api/admin')->middleware(['api', 'tenant'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// Protected admin routes (tenant + auth required)
Route::prefix('api/admin')->middleware(['api', 'tenant', 'auth:sanctum'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    // /auth/refresh removed — Sanctum SPA sessions auto-extend on activity (lifetime in config/session.php).

    Route::prefix('usersguard')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
