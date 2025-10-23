<?php
use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Frontend\IndexController;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE - Public + Protected)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('usersguard')->group(function () {
        // Public routes
        Route::get('/', [IndexController::class, 'index']);

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            // Routes authentifiées
        });
    });
});
