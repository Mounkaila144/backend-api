<?php

use Illuminate\Support\Facades\Route;
use Modules\AppDomoprimeYousignEvidence\Http\Controllers\Api\YousignEvidenceWebhookController;

/*
|--------------------------------------------------------------------------
| Yousign Evidence — Public API routes (no Sanctum auth)
|--------------------------------------------------------------------------
| Webhooks delivered by Yousign hit these endpoints. The signature header
| is verified by the `verify.yousign.signature` middleware (registered in
| the controller — see Phase D scaffold).
*/

Route::prefix('api/webhooks')->group(function () {
    Route::post('/yousign-evidence', [YousignEvidenceWebhookController::class, 'handle'])
        ->name('webhooks.yousign-evidence');
});
