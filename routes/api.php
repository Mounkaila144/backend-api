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

// Mirror of Sanctum's /sanctum/csrf-cookie inside the /api/* path so it survives any
// frontend redirect rule that otherwise rewrites root paths (e.g. Next.js locale
// catch-all). The api group's EnsureFrontendRequestsAreStateful adds StartSession +
// AddQueuedCookiesToResponse which is what actually sets the XSRF-TOKEN cookie.
Route::get('/csrf-cookie', function () {
    return response()->noContent();
})->name('api.csrf-cookie');

// Permission routes (requires authentication).
// NOTE: routes/api.php is auto-prefixed with 'api/' by withRouting(api: ...) in
// bootstrap/app.php — so we only declare the path AFTER 'api/'. Using 'api/auth'
// here would produce 'api/api/auth/...' (the bug we removed).
Route::middleware(['tenant', 'auth:sanctum'])->prefix('auth')->group(function () {
    Route::get('/permissions', [PermissionController::class, 'index'])->name('api.permissions.index');
    Route::post('/permissions/check', [PermissionController::class, 'check'])->name('api.permissions.check');
    Route::post('/permissions/batch-check', [PermissionController::class, 'batchCheck'])->name('api.permissions.batch');
});