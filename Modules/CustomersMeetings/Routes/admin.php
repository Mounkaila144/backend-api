<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersMeetings\Http\Controllers\Admin\MeetingActionController;
use Modules\CustomersMeetings\Http\Controllers\Admin\MeetingController;
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

        // Main meeting routes
        Route::get('/meetings', [MeetingController::class, 'index'])->name('meetings.index');
        Route::post('/meetings', [MeetingController::class, 'store'])->name('meetings.store');
        Route::get('/meetings/filter-options', [MeetingController::class, 'filterOptions'])->name('meetings.filterOptions');
        Route::get('/meetings/statistics', [MeetingController::class, 'statistics'])->name('meetings.statistics');
        Route::get('/meetings/{id}', [MeetingController::class, 'show'])->name('meetings.show');
        Route::put('/meetings/{id}', [MeetingController::class, 'update'])->name('meetings.update');
        Route::delete('/meetings/{id}', [MeetingController::class, 'destroy'])->name('meetings.destroy');
        Route::get('/meetings/{id}/history', [MeetingController::class, 'history'])->name('meetings.history');

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
            Route::post('/comments', [MeetingActionController::class, 'addComment'])->name('meetings.addComment');
        });
    });
});
