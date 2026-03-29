<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersMeetingsForms\Http\Controllers\Admin\MeetingFormsController;

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('customersmeetingsforms')->name('admin.customersmeetingsforms.')->group(function () {
        Route::get('/contracts/{contractId}/forms', [MeetingFormsController::class, 'forContract'])
            ->name('contracts.forms');
        Route::put('/contracts/{contractId}/forms', [MeetingFormsController::class, 'saveForContract'])
            ->name('contracts.forms.save');
        Route::get('/meetings/{meetingId}/forms', [MeetingFormsController::class, 'forMeeting'])
            ->name('meetings.forms');
        Route::put('/meetings/{meetingId}/forms', [MeetingFormsController::class, 'saveForMeeting'])
            ->name('meetings.forms.save');

        // Form template CRUD (admin config)
        Route::get('/config/forms', [MeetingFormsController::class, 'listFormTemplates'])
            ->name('config.forms.index');
        Route::post('/config/forms', [MeetingFormsController::class, 'createFormTemplate'])
            ->name('config.forms.store');
        Route::put('/config/forms/{id}', [MeetingFormsController::class, 'updateFormTemplate'])
            ->name('config.forms.update');
        Route::delete('/config/forms/{id}', [MeetingFormsController::class, 'deleteFormTemplate'])
            ->name('config.forms.destroy');
        Route::get('/config/forms/{id}/fields', [MeetingFormsController::class, 'listFormFields'])
            ->name('config.forms.fields');
        Route::put('/config/forms/{id}/fields', [MeetingFormsController::class, 'saveFormFields'])
            ->name('config.forms.fields.save');
    });
});
