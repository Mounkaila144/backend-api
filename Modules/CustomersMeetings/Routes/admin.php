<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersMeetings\Http\Controllers\Admin\MeetingActionController;
use Modules\CustomersMeetings\Http\Controllers\Admin\MeetingController;
use Modules\CustomersMeetings\Http\Controllers\Admin\MeetingSettingsController;
use Modules\CustomersMeetings\Http\Controllers\Admin\MeetingConfigController;
use Modules\CustomersMeetings\Http\Controllers\Admin\IndexController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
*/

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('customersmeetings')->name('admin.customersmeetings.')->group(function () {
        // Legacy placeholder routes
        Route::get('/legacy', [IndexController::class, 'index'])->name('legacy.index');

        // Settings routes
        Route::get('/settings', [MeetingSettingsController::class, 'show'])->name('settings.show');
        Route::put('/settings', [MeetingSettingsController::class, 'update'])->name('settings.update');
        Route::get('/settings/options', [MeetingSettingsController::class, 'options'])->name('settings.options');

        // ─── Configuration CRUD (statuses, types, campaigns, ranges) ───
        Route::prefix('config')->name('config.')->group(function () {
            // Generic status CRUD (3 types: statuses, status-calls, status-leads)
            Route::get('/{type}', [MeetingConfigController::class, 'statusIndex'])
                ->where('type', 'statuses|status-calls|status-leads')
                ->name('status.index');
            Route::post('/{type}', [MeetingConfigController::class, 'statusStore'])
                ->where('type', 'statuses|status-calls|status-leads')
                ->name('status.store');
            Route::get('/{type}/{id}', [MeetingConfigController::class, 'statusShow'])
                ->where(['type' => 'statuses|status-calls|status-leads', 'id' => '[0-9]+'])
                ->name('status.show');
            Route::put('/{type}/{id}', [MeetingConfigController::class, 'statusUpdate'])
                ->where(['type' => 'statuses|status-calls|status-leads', 'id' => '[0-9]+'])
                ->name('status.update');
            Route::delete('/{type}/{id}', [MeetingConfigController::class, 'statusDestroy'])
                ->where(['type' => 'statuses|status-calls|status-leads', 'id' => '[0-9]+'])
                ->name('status.destroy');

            // Type CRUD (name + i18n, no color/icon)
            Route::get('/types', [MeetingConfigController::class, 'typeIndex'])->name('types.index');
            Route::post('/types', [MeetingConfigController::class, 'typeStore'])->name('types.store');
            Route::put('/types/{id}', [MeetingConfigController::class, 'typeUpdate'])->name('types.update');
            Route::delete('/types/{id}', [MeetingConfigController::class, 'typeDestroy'])->name('types.destroy');

            // Campaign CRUD (name only, no i18n)
            Route::get('/campaigns', [MeetingConfigController::class, 'campaignIndex'])->name('campaigns.index');
            Route::post('/campaigns', [MeetingConfigController::class, 'campaignStore'])->name('campaigns.store');
            Route::put('/campaigns/{id}', [MeetingConfigController::class, 'campaignUpdate'])->name('campaigns.update');
            Route::delete('/campaigns/{id}', [MeetingConfigController::class, 'campaignDestroy'])->name('campaigns.destroy');

            // Range Date CRUD
            Route::get('/ranges', [MeetingConfigController::class, 'rangeIndex'])->name('ranges.index');
            Route::post('/ranges', [MeetingConfigController::class, 'rangeStore'])->name('ranges.store');
            Route::put('/ranges/{id}', [MeetingConfigController::class, 'rangeUpdate'])->name('ranges.update');
            Route::delete('/ranges/{id}', [MeetingConfigController::class, 'rangeDestroy'])->name('ranges.destroy');
        });

        // Main meeting routes
        Route::get('/meetings', [MeetingController::class, 'index'])->name('meetings.index');
        Route::post('/meetings', [MeetingController::class, 'store'])->name('meetings.store');
        Route::get('/meetings/filter-options', [MeetingController::class, 'filterOptions'])->name('meetings.filterOptions');
        Route::get('/meetings/statistics', [MeetingController::class, 'statistics'])->name('meetings.statistics');
        Route::get('/meetings/{id}', [MeetingController::class, 'show'])->name('meetings.show');
        Route::put('/meetings/{id}', [MeetingController::class, 'update'])->name('meetings.update');
        Route::delete('/meetings/{id}', [MeetingController::class, 'destroy'])->name('meetings.destroy');
        Route::get('/meetings/{id}/history', [MeetingController::class, 'history'])->name('meetings.history');
        Route::get('/meetings/{id}/duplicate-mobile', [MeetingController::class, 'duplicateMobile'])->name('meetings.duplicateMobile');

        // Meeting action routes
        Route::prefix('meetings/{id}')->group(function () {
            // State transitions
            Route::patch('/confirm', [MeetingActionController::class, 'confirm'])->name('meetings.confirm');
            Route::patch('/unconfirm', [MeetingActionController::class, 'unconfirm'])->name('meetings.unconfirm');
            Route::patch('/cancel', [MeetingActionController::class, 'cancel'])->name('meetings.cancel');
            Route::patch('/uncancel', [MeetingActionController::class, 'uncancel'])->name('meetings.uncancel');

            // Hold toggles
            Route::patch('/hold', [MeetingActionController::class, 'hold'])->name('meetings.hold');
            Route::patch('/unhold', [MeetingActionController::class, 'unhold'])->name('meetings.unhold');
            Route::patch('/hold-quote', [MeetingActionController::class, 'holdQuote'])->name('meetings.holdQuote');
            Route::patch('/unhold-quote', [MeetingActionController::class, 'unholdQuote'])->name('meetings.unholdQuote');

            // Lock management
            Route::patch('/lock', [MeetingActionController::class, 'lock'])->name('meetings.lock');
            Route::patch('/unlock', [MeetingActionController::class, 'unlock'])->name('meetings.unlock');

            // Callback management
            Route::patch('/cancel-callback', [MeetingActionController::class, 'cancelCallback'])->name('meetings.cancelCallback');

            // Copy & Recycle
            Route::post('/copy', [MeetingActionController::class, 'copy'])->name('meetings.copy');
            Route::patch('/recycle', [MeetingActionController::class, 'recycle'])->name('meetings.recycle');

            // Create contract from meeting
            Route::post('/create-contract', [MeetingActionController::class, 'createContract'])->name('meetings.createContract');

            // Communication
            Route::post('/send-sms', [MeetingActionController::class, 'sendSms'])->name('meetings.sendSms');
            Route::post('/send-email', [MeetingActionController::class, 'sendEmail'])->name('meetings.sendEmail');

            // Comments
            Route::get('/comments', [MeetingActionController::class, 'listComments'])->name('meetings.listComments');
            Route::post('/comments', [MeetingActionController::class, 'addComment'])->name('meetings.addComment');

            // History / Logs
            Route::get('/logs', [MeetingActionController::class, 'listHistory'])->name('meetings.listHistory');
        });
    });
});
