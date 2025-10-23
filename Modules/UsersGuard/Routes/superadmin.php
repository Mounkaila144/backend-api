<?php
use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Superadmin\IndexController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
*/

Route::prefix('superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('usersguard')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
