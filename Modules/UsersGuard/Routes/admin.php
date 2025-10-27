<?php
use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Admin\AuthController;
use Modules\UsersGuard\Http\Controllers\Admin\IndexController;
// Public admin routes (tenant context required)
Route::prefix('admin')->middleware(['tenant'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// Protected admin routes (tenant + auth required)
Route::prefix('admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    Route::prefix('usersguard')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
