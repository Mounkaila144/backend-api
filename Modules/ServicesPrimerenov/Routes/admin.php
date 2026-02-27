<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Services PrimeRénov - Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
|
| Matches Symfony: modules/services_primerenov/admin/config/routings.php
|
| Symfony actions:
|  - ajaxListRequest           → list all PrimeRénov requests
|  - ajaxRefreshCustomer       → fetch & sync customer's PrimeRénov data
|  - ajaxRefreshCustomerForContract → fetch & return for contract form
|  - ajaxSettings              → module settings
|  - ajaxTest                  → test API credentials
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('services-primerenov')->name('admin.servicesprimerenov.')->group(function () {
        // TODO: Implement endpoints as needed
        // Route::get('/requests', [RequestController::class, 'index'])->name('requests.index');
        // Route::post('/refresh/{customerId}', [RequestController::class, 'refresh'])->name('requests.refresh');
        // Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        // Route::post('/settings', [SettingsController::class, 'store'])->name('settings.store');
    });
});
