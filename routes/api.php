<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\PermissionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Toutes les routes sont définies dans les modules respectifs
|
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Multi-Tenant API is running',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Permission routes (requires authentication)
Route::middleware(['auth:sanctum', 'tenant'])->prefix('api/auth')->group(function () {
    Route::get('/permissions', [PermissionController::class, 'index'])->name('api.permissions.index');
    Route::post('/permissions/check', [PermissionController::class, 'check'])->name('api.permissions.check');
    Route::post('/permissions/batch-check', [PermissionController::class, 'batchCheck'])->name('api.permissions.batch');
});