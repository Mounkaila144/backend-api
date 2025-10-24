<?php
use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Admin\IndexController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('usersguard')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
