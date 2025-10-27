<?php

use Illuminate\Support\Facades\Route;

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