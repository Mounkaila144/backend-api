<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomersDocuments\Http\Controllers\Admin\DocumentController;

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('customersdocuments')->name('admin.customersdocuments.')->group(function () {
        // Settings
        Route::get('/settings', [DocumentController::class, 'getSettings'])->name('settings');
        Route::put('/settings', [DocumentController::class, 'saveSettings'])->name('settings.save');

        // Documents per contract
        Route::get('/contracts/{contractId}/documents', [DocumentController::class, 'index'])->name('contracts.documents');
        Route::post('/contracts/{contractId}/documents/upload', [DocumentController::class, 'upload'])->name('contracts.documents.upload');
        Route::get('/contracts/{contractId}/documents/{documentId}/download', [DocumentController::class, 'download'])->name('contracts.documents.download');
        Route::delete('/contracts/{contractId}/documents/{documentId}', [DocumentController::class, 'destroy'])->name('contracts.documents.destroy');
    });
});
