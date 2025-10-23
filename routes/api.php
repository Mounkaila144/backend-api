<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SiteController;

/*
|--------------------------------------------------------------------------
| API Routes Multi-Tenant
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Multi-Tenant API is running',
        'timestamp' => now()->toIso8601String(),
        'database' => [
            'central' => config('database.connections.mysql.database'),
        ],
    ]);
});

/*
|--------------------------------------------------------------------------
| Routes CENTRALES (Superadmin - Base Centrale)
|--------------------------------------------------------------------------
*/

Route::prefix('superadmin')->group(function () {

    // Auth superadmin (public)
    Route::post('/auth/login', [AuthController::class, 'loginSuperadmin']);

    // Routes protégées superadmin
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);

        // Gestion des sites/tenants
        Route::prefix('sites')->group(function () {
            Route::get('/', [SiteController::class, 'index']);
            Route::post('/', [SiteController::class, 'store']);
            Route::get('/{id}', [SiteController::class, 'show']);
            Route::put('/{id}', [SiteController::class, 'update']);
            Route::delete('/{id}', [SiteController::class, 'destroy']);
            Route::post('/{id}/test-connection', [SiteController::class, 'testConnection']);
        });
    });
});

/*
|--------------------------------------------------------------------------
| Routes TENANT (Base du Site)
|--------------------------------------------------------------------------
| Middleware 'tenant' : Switch vers la base du site
*/

// Auth tenant (public avec header X-Tenant-ID)
Route::middleware(['tenant'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'loginTenant']);
});

// Routes protégées tenant
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Les routes des modules seront chargées automatiquement
    // via Modules/*/Routes/*.php
});
