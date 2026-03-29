<?php

use Illuminate\Support\Facades\Route;
use Modules\AppDomoprime\Http\Controllers\Admin\AppDomoprimeController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('appdomoprime')->name('admin.appdomoprime.')->group(function () {
        Route::get('/filter-options', [AppDomoprimeController::class, 'filterOptions'])->name('filterOptions');
        Route::get('/iso-requests/contract/{contractId}', [AppDomoprimeController::class, 'getIsoRequestByContract'])->name('isoRequestByContract');
        Route::get('/iso-requests/meeting/{meetingId}', [AppDomoprimeController::class, 'getIsoRequestByMeeting'])->name('isoRequestByMeeting');
        Route::get('/calculations/meeting/{meetingId}', [AppDomoprimeController::class, 'listCalculationsForMeeting'])->name('calculationsForMeeting');
    });
});
