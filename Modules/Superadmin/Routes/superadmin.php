<?php

use Illuminate\Support\Facades\Route;
use Modules\Superadmin\Http\Controllers\Superadmin\ModuleController;
use Modules\Superadmin\Http\Controllers\Superadmin\AuditController;
use Modules\Superadmin\Http\Controllers\Superadmin\ServiceConfigController;
use Modules\Superadmin\Http\Controllers\Superadmin\HealthController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
| Aucun middleware tenant - uniquement authentification Sanctum
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    // Liste des modules disponibles
    Route::get('modules', [ModuleController::class, 'index'])
        ->name('superadmin.modules.index');

    // Modules par tenant
    Route::get('sites/{id}/modules', [ModuleController::class, 'tenantModules'])
        ->name('superadmin.sites.modules.index');

    // Graphe des dépendances entre modules
    Route::get('modules/dependencies', [ModuleController::class, 'dependencies'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.modules.dependencies');

    // Graphe de dépendances d'un module spécifique (DOIT ÊTRE AVANT {module}/dependents)
    Route::get('modules/{module}/dependencies/graph', [ModuleController::class, 'dependencyGraph'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.modules.dependency-graph');

    // Modules dépendants d'un module donné
    Route::get('modules/{module}/dependents', [ModuleController::class, 'dependents'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.modules.dependents');

    // Résoudre les dépendances de modules
    Route::post('modules/resolve-dependencies', [ModuleController::class, 'resolveDependencies'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.modules.resolve-dependencies');

    // Activer plusieurs modules en batch pour un tenant (DOIT ÊTRE AVANT {module})
    Route::post('sites/{id}/modules/batch', [ModuleController::class, 'activateBatch'])
        ->middleware('throttle:superadmin-heavy')
        ->name('superadmin.sites.modules.activate.batch');

    // Désactiver plusieurs modules en batch pour un tenant (DOIT ÊTRE AVANT {module})
    Route::delete('sites/{id}/modules/batch', [ModuleController::class, 'deactivateBatch'])
        ->middleware('throttle:superadmin-heavy')
        ->name('superadmin.sites.modules.deactivate.batch');

    // Analyser l'impact de désactivation d'un module (DOIT ÊTRE AVANT {module})
    Route::get('sites/{id}/modules/{module}/impact', [ModuleController::class, 'deactivationImpact'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.sites.modules.impact');

    // Activer un module pour un tenant
    Route::post('sites/{id}/modules/{module}', [ModuleController::class, 'activate'])
        ->middleware('throttle:superadmin-heavy')
        ->name('superadmin.sites.modules.activate');

    // Désactiver un module pour un tenant
    Route::delete('sites/{id}/modules/{module}', [ModuleController::class, 'deactivate'])
        ->middleware('throttle:superadmin-heavy')
        ->name('superadmin.sites.modules.deactivate');

    // Audit trail - consulter l'historique des opérations
    Route::get('audit', [AuditController::class, 'index'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.audit.index');

    // Dashboard santé global
    Route::get('health', [HealthController::class, 'index'])
        ->middleware('throttle:superadmin-read')
        ->name('superadmin.health.index');
    Route::post('health/test-all', [HealthController::class, 'testAll'])
        ->middleware('throttle:superadmin-heavy')
        ->name('superadmin.health.test-all');
    Route::post('health/refresh', [HealthController::class, 'refresh'])
        ->middleware('throttle:superadmin-write')
        ->name('superadmin.health.refresh');

    // Configuration des services externes
    Route::prefix('config')->name('superadmin.config.')->group(function () {
        // S3/Minio
        Route::get('s3', [ServiceConfigController::class, 'getS3Config'])
            ->middleware('throttle:superadmin-read')
            ->name('s3.show');
        Route::put('s3', [ServiceConfigController::class, 'updateS3Config'])
            ->middleware('throttle:superadmin-write')
            ->name('s3.update');
        Route::get('s3/test', [ServiceConfigController::class, 'testS3Connection'])
            ->middleware('throttle:superadmin-read')
            ->name('s3.test');

        // Resend (Email)
        Route::get('resend', [ServiceConfigController::class, 'getResendConfig'])
            ->middleware('throttle:superadmin-read')
            ->name('resend.show');
        Route::put('resend', [ServiceConfigController::class, 'updateResendConfig'])
            ->middleware('throttle:superadmin-write')
            ->name('resend.update');
        Route::get('resend/test', [ServiceConfigController::class, 'testResendConnection'])
            ->middleware('throttle:superadmin-read')
            ->name('resend.test');

        // Meilisearch
        Route::get('meilisearch', [ServiceConfigController::class, 'getMeilisearchConfig'])
            ->middleware('throttle:superadmin-read')
            ->name('meilisearch.show');
        Route::put('meilisearch', [ServiceConfigController::class, 'updateMeilisearchConfig'])
            ->middleware('throttle:superadmin-write')
            ->name('meilisearch.update');
        Route::get('meilisearch/test', [ServiceConfigController::class, 'testMeilisearchConnection'])
            ->middleware('throttle:superadmin-read')
            ->name('meilisearch.test');
    });

    // Module Superadmin routes - placeholder pour vérification
    Route::prefix('modules')->name('superadmin.modules.')->group(function () {
        Route::get('health', function () {
            return response()->json([
                'status' => 'ok',
                'module' => 'Superadmin',
                'message' => 'Module Superadmin opérationnel'
            ]);
        })->name('health');
    });
});
