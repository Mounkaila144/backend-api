# Script pour créer un module multi-tenant avec structure admin/superadmin/frontend
param(
    [Parameter(Mandatory=$true)]
    [string]$ModuleName
)

Write-Host "🚀 Creating multi-tenant module: $ModuleName" -ForegroundColor Green

# Créer le module
php artisan module:make $ModuleName

# Créer les contrôleurs pour chaque layer
Write-Host "📁 Creating controllers..." -ForegroundColor Yellow
php artisan module:make-controller "Admin/IndexController" $ModuleName --api
php artisan module:make-controller "Superadmin/IndexController" $ModuleName --api
php artisan module:make-controller "Frontend/IndexController" $ModuleName --api

# Créer le dossier Repositories
Write-Host "📁 Creating Repositories folder..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Repositories" | Out-Null

# Créer les fichiers de routes personnalisés
Write-Host "📝 Creating route files..." -ForegroundColor Yellow

$moduleLower = $ModuleName.ToLower()

$adminRoute = @'
<?php
use Illuminate\Support\Facades\Route;
use Modules\{MODULE_NAME}\Http\Controllers\Admin\IndexController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('admin')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::prefix('{MODULE_LOWER}')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
'@

$superadminRoute = @'
<?php
use Illuminate\Support\Facades\Route;
use Modules\{MODULE_NAME}\Http\Controllers\Superadmin\IndexController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
*/

Route::prefix('superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('{MODULE_LOWER}')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
    });
});
'@

$frontendRoute = @'
<?php
use Illuminate\Support\Facades\Route;
use Modules\{MODULE_NAME}\Http\Controllers\Frontend\IndexController;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE - Public + Protected)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('{MODULE_LOWER}')->group(function () {
        // Public routes
        Route::get('/', [IndexController::class, 'index']);

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            // Routes authentifiées
        });
    });
});
'@

# Remplacer les placeholders
$adminRoute = $adminRoute.Replace('{MODULE_NAME}', $ModuleName).Replace('{MODULE_LOWER}', $moduleLower)
$superadminRoute = $superadminRoute.Replace('{MODULE_NAME}', $ModuleName).Replace('{MODULE_LOWER}', $moduleLower)
$frontendRoute = $frontendRoute.Replace('{MODULE_NAME}', $ModuleName).Replace('{MODULE_LOWER}', $moduleLower)

# Créer les fichiers
$adminRoute | Out-File -FilePath "Modules\$ModuleName\Routes\admin.php" -Encoding UTF8 -NoNewline
$superadminRoute | Out-File -FilePath "Modules\$ModuleName\Routes\superadmin.php" -Encoding UTF8 -NoNewline
$frontendRoute | Out-File -FilePath "Modules\$ModuleName\Routes\frontend.php" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ Multi-tenant module $ModuleName created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Structure:" -ForegroundColor Cyan
Write-Host "Modules\$ModuleName\"
Write-Host "├── Entities/          # Modèles (tables TENANT)"
Write-Host "├── Http\"
Write-Host "│   ├── Controllers\"
Write-Host "│   │   ├── Admin\         # Tenant DB"
Write-Host "│   │   ├── Superadmin\    # Central DB"
Write-Host "│   │   └── Frontend\      # Tenant DB"
Write-Host "└── Routes\"
Write-Host "    ├── admin.php          # middleware: ['tenant']"
Write-Host "    ├── superadmin.php     # NO tenant middleware"
Write-Host "    └── frontend.php       # middleware: ['tenant']"
