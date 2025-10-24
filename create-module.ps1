# Script pour créer un module multi-tenant avec structure admin/superadmin/frontend
param(
    [Parameter(Mandatory=$true)]
    [string]$ModuleName
)

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Creating module: $ModuleName" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Créer le module de base
Write-Host "[1/7] Creating base module..." -ForegroundColor Yellow
php artisan module:make $ModuleName

# Vérifier que le module a été créé
if (-not (Test-Path "Modules\$ModuleName\module.json")) {
    Write-Host "ERROR: Module creation failed!" -ForegroundColor Red
    exit 1
}

# Attendre un peu pour s'assurer que les fichiers sont créés
Start-Sleep -Seconds 1

# Variables utiles
$moduleLower = $ModuleName.ToLower()
$moduleStudly = $ModuleName

# 1.1 Corriger le fichier module.json
Write-Host "[1.1/7] Fixing module.json..." -ForegroundColor Yellow

# Utiliser PHP pour écrire le JSON sans BOM
$phpCommand = @"
<?php
`$data = [
    'name' => '$ModuleName',
    'alias' => '$moduleLower',
    'description' => '$ModuleName module with multi-tenant support',
    'keywords' => [],
    'priority' => 0,
    'providers' => ['Modules\\\\$ModuleName\\\\Providers\\\\${ModuleName}ServiceProvider'],
    'files' => []
];
file_put_contents('Modules/$ModuleName/module.json', json_encode(`$data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
"@

$phpCommand | Out-File -FilePath "temp_json.php" -Encoding UTF8 -NoNewline
php temp_json.php
Remove-Item "temp_json.php" -Force

# 1.2 Corriger le fichier Config/config.php
Write-Host "[1.2/7] Fixing Config/config.php..." -ForegroundColor Yellow

$configContent = @"
<?php

return [
    'name' => '$ModuleName',
];
"@

# S'assurer que le dossier Config existe
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Config" | Out-Null
$configContent | Out-File -FilePath "Modules\$ModuleName\Config\config.php" -Encoding UTF8 -NoNewline

# 1.3 Corriger composer.json du module
Write-Host "[1.3/7] Fixing composer.json..." -ForegroundColor Yellow

$composerContent = @"
{
    "name": "nwidart/$(${moduleLower})",
    "description": "$ModuleName module with multi-tenant support",
    "type": "laravel-module",
    "authors": [
        {
            "name": "Your Name",
            "email": "your.email@example.com"
        }
    ],
    "require": {},
    "extra": {
        "laravel": {
            "providers": [],
            "aliases": {}
        }
    },
    "autoload": {
        "psr-4": {
            "Modules\\$ModuleName\\": ""
        }
    }
}
"@

$composerContent | Out-File -FilePath "Modules\$ModuleName\composer.json" -Encoding UTF8 -NoNewline

# 2. Créer le ServiceProvider corrigé
Write-Host "[2/7] Creating ServiceProvider..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Providers" | Out-Null

$serviceProvider = @"
<?php

namespace Modules\$ModuleName\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;

class ${ModuleName}ServiceProvider extends ServiceProvider
{
    /**
     * @var string Module name
     */
    protected `$moduleName = '$ModuleName';

    /**
     * @var string Module name lowercase
     */
    protected `$moduleNameLower = '$moduleLower';

    /**
     * Boot the application events.
     */
    public function boot(): void
    {
        `$this->registerTranslations();
        `$this->registerConfig();
        `$this->registerViews();
        `$this->loadMigrationsFrom(module_path(`$this->moduleName, 'Database/migrations'));
        `$this->registerRoutes();
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        `$this->app->register(RouteServiceProvider::class);
    }

    /**
     * Register config.
     */
    protected function registerConfig(): void
    {
        `$this->publishes([
            module_path(`$this->moduleName, 'Config/config.php') => config_path(`$this->moduleNameLower . '.php'),
        ], 'config');

        `$this->mergeConfigFrom(
            module_path(`$this->moduleName, 'Config/config.php'),
            `$this->moduleNameLower
        );
    }

    /**
     * Register views.
     */
    public function registerViews(): void
    {
        `$viewPath = resource_path('views/modules/' . `$this->moduleNameLower);
        `$sourcePath = module_path(`$this->moduleName, 'Resources/views');

        `$this->publishes([
            `$sourcePath => `$viewPath
        ], ['views', `$this->moduleNameLower . '-module-views']);

        `$this->loadViewsFrom(array_merge(`$this->getPublishableViewPaths(), [`$sourcePath]), `$this->moduleNameLower);
    }

    /**
     * Register translations.
     */
    public function registerTranslations(): void
    {
        `$langPath = resource_path('lang/modules/' . `$this->moduleNameLower);

        if (is_dir(`$langPath)) {
            `$this->loadTranslationsFrom(`$langPath, `$this->moduleNameLower);
            `$this->loadJsonTranslationsFrom(`$langPath);
        } else {
            `$this->loadTranslationsFrom(module_path(`$this->moduleName, 'Resources/lang'), `$this->moduleNameLower);
            `$this->loadJsonTranslationsFrom(module_path(`$this->moduleName, 'Resources/lang'));
        }
    }

    /**
     * Register routes
     */
    protected function registerRoutes(): void
    {
        `$modulePath = module_path(`$this->moduleName);

        // Admin routes (Tenant DB)
        if (file_exists(`$modulePath . '/Routes/admin.php')) {
            `$this->loadRoutesFrom(`$modulePath . '/Routes/admin.php');
        }

        // Superadmin routes (Central DB)
        if (file_exists(`$modulePath . '/Routes/superadmin.php')) {
            `$this->loadRoutesFrom(`$modulePath . '/Routes/superadmin.php');
        }

        // Frontend routes (Tenant DB)
        if (file_exists(`$modulePath . '/Routes/frontend.php')) {
            `$this->loadRoutesFrom(`$modulePath . '/Routes/frontend.php');
        }

        // API routes
        if (file_exists(`$modulePath . '/Routes/api.php')) {
            `$this->loadRoutesFrom(`$modulePath . '/Routes/api.php');
        }

        // Web routes
        if (file_exists(`$modulePath . '/Routes/web.php')) {
            `$this->loadRoutesFrom(`$modulePath . '/Routes/web.php');
        }
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [];
    }

    /**
     * Get publishable view paths
     */
    private function getPublishableViewPaths(): array
    {
        `$paths = [];
        foreach (Config::get('view.paths') as `$path) {
            if (is_dir(`$path . '/modules/' . `$this->moduleNameLower)) {
                `$paths[] = `$path . '/modules/' . `$this->moduleNameLower;
            }
        }
        return `$paths;
    }
}
"@

$serviceProvider | Out-File -FilePath "Modules\$ModuleName\Providers\${ModuleName}ServiceProvider.php" -Encoding UTF8 -NoNewline

# Créer le RouteServiceProvider
$routeServiceProvider = @"
<?php

namespace Modules\$ModuleName\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The module namespace to assume when generating URLs to actions.
     */
    protected string `$moduleNamespace = 'Modules\\$ModuleName\\Http\\Controllers';

    /**
     * Called before routes are registered.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Define the routes for the application.
     */
    public function map(): void
    {
        `$this->mapApiRoutes();
        `$this->mapWebRoutes();
    }

    /**
     * Define the "web" routes for the application.
     */
    protected function mapWebRoutes(): void
    {
        // Web routes implementation if needed
    }

    /**
     * Define the "api" routes for the application.
     */
    protected function mapApiRoutes(): void
    {
        // API routes implementation if needed
    }
}
"@

$routeServiceProvider | Out-File -FilePath "Modules\$ModuleName\Providers\RouteServiceProvider.php" -Encoding UTF8 -NoNewline

# 3. Créer le dossier Repositories
Write-Host "[3/7] Creating Repositories folder..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Repositories" | Out-Null

# 4. Créer les contrôleurs pour chaque layer
Write-Host "[4/7] Creating controllers..." -ForegroundColor Yellow

# Créer les dossiers de contrôleurs
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Http\Controllers\Admin" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Http\Controllers\Superadmin" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Http\Controllers\Frontend" | Out-Null

# Créer les contrôleurs
$adminController = @"
<?php

namespace Modules\$ModuleName\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Admin Controller (TENANT DATABASE)
 */
class IndexController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Admin index - Tenant database',
            'module' => '$ModuleName',
            'data' => [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request `$request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource created successfully',
            'data' => [],
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string `$id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['id' => `$id],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request `$request, string `$id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource updated successfully',
            'data' => ['id' => `$id],
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string `$id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource deleted successfully',
        ]);
    }
}
"@

$superadminController = @"
<?php

namespace Modules\$ModuleName\Http\Controllers\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Superadmin Controller (CENTRAL DATABASE)
 */
class IndexController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Superadmin index - Central database',
            'module' => '$ModuleName',
            'data' => [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request `$request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource created in central database',
            'data' => [],
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string `$id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['id' => `$id],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request `$request, string `$id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource updated in central database',
            'data' => ['id' => `$id],
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string `$id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource deleted from central database',
        ]);
    }
}
"@

$frontendController = @"
<?php

namespace Modules\$ModuleName\Http\Controllers\Frontend;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Frontend Controller (TENANT DATABASE)
 */
class IndexController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Frontend index - Tenant database',
            'module' => '$ModuleName',
            'data' => [],
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string `$id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['id' => `$id],
        ]);
    }
}
"@

# Sauvegarder les contrôleurs
$adminController | Out-File -FilePath "Modules\$ModuleName\Http\Controllers\Admin\IndexController.php" -Encoding UTF8 -NoNewline
$superadminController | Out-File -FilePath "Modules\$ModuleName\Http\Controllers\Superadmin\IndexController.php" -Encoding UTF8 -NoNewline
$frontendController | Out-File -FilePath "Modules\$ModuleName\Http\Controllers\Frontend\IndexController.php" -Encoding UTF8 -NoNewline

Write-Host "   - Admin/IndexController.php created" -ForegroundColor Gray
Write-Host "   - Superadmin/IndexController.php created" -ForegroundColor Gray
Write-Host "   - Frontend/IndexController.php created" -ForegroundColor Gray

# 5. Créer les fichiers de routes personnalisés
Write-Host "[5/7] Creating route files..." -ForegroundColor Yellow

# Créer le dossier Routes s'il n'existe pas
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Routes" | Out-Null

$adminRoute = @"
<?php

use Illuminate\Support\Facades\Route;
use Modules\$ModuleName\Http\Controllers\Admin\IndexController;

/*
|--------------------------------------------------------------------------
| Admin Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('api/admin')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::prefix('$moduleLower')->name('admin.$moduleLower.')->group(function () {
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::post('/', [IndexController::class, 'store'])->name('store');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');
        Route::put('/{id}', [IndexController::class, 'update'])->name('update');
        Route::delete('/{id}', [IndexController::class, 'destroy'])->name('destroy');
    });
});
"@

$superadminRoute = @"
<?php

use Illuminate\Support\Facades\Route;
use Modules\$ModuleName\Http\Controllers\Superadmin\IndexController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('$moduleLower')->name('superadmin.$moduleLower.')->group(function () {
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::post('/', [IndexController::class, 'store'])->name('store');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');
        Route::put('/{id}', [IndexController::class, 'update'])->name('update');
        Route::delete('/{id}', [IndexController::class, 'destroy'])->name('destroy');
    });
});
"@

$frontendRoute = @"
<?php

use Illuminate\Support\Facades\Route;
use Modules\$ModuleName\Http\Controllers\Frontend\IndexController;

/*
|--------------------------------------------------------------------------
| Frontend Routes (TENANT DATABASE - Public + Protected)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du tenant
*/

Route::prefix('api/frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('$moduleLower')->name('frontend.$moduleLower.')->group(function () {
        // Public routes
        Route::get('/', [IndexController::class, 'index'])->name('index');
        Route::get('/{id}', [IndexController::class, 'show'])->name('show');

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            // Routes authentifiées ici
        });
    });
});
"@

# Routes API et Web par défaut (vides mais avec structure)
$apiRoute = @"
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Route::middleware('auth:sanctum')->get('/$moduleLower', function (Request `$request) {
//     return `$request->user();
// });
"@

$webRoute = @"
<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::prefix('$moduleLower')->group(function() {
    // Route::get('/', '$ModuleName\Http\Controllers\${ModuleName}Controller@index');
});
"@

# Sauvegarder les fichiers de routes
$adminRoute | Out-File -FilePath "Modules\$ModuleName\Routes\admin.php" -Encoding UTF8 -NoNewline
$superadminRoute | Out-File -FilePath "Modules\$ModuleName\Routes\superadmin.php" -Encoding UTF8 -NoNewline
$frontendRoute | Out-File -FilePath "Modules\$ModuleName\Routes\frontend.php" -Encoding UTF8 -NoNewline
$apiRoute | Out-File -FilePath "Modules\$ModuleName\Routes\api.php" -Encoding UTF8 -NoNewline
$webRoute | Out-File -FilePath "Modules\$ModuleName\Routes\web.php" -Encoding UTF8 -NoNewline

Write-Host "   - admin.php created" -ForegroundColor Gray
Write-Host "   - superadmin.php created" -ForegroundColor Gray
Write-Host "   - frontend.php created" -ForegroundColor Gray
Write-Host "   - api.php created" -ForegroundColor Gray
Write-Host "   - web.php created" -ForegroundColor Gray

# 6. Créer les dossiers supplémentaires si nécessaire
Write-Host "[6/7] Creating additional folders..." -ForegroundColor Yellow

# Créer le dossier Database/migrations s'il n'existe pas
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Database\migrations" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Database\Seeders" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Database\factories" | Out-Null

# Créer le dossier Resources
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Resources\views" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Resources\lang" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Resources\assets\js" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Resources\assets\css" | Out-Null

# Créer le dossier Tests
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Tests\Unit" | Out-Null
New-Item -ItemType Directory -Force -Path "Modules\$ModuleName\Tests\Feature" | Out-Null

# 7. Supprimer le BOM UTF-8 de tous les fichiers PHP/JSON (si le script existe)
if (Test-Path "remove-bom.php") {
    Write-Host "[7/7] Removing UTF-8 BOM from all files..." -ForegroundColor Yellow
    php remove-bom.php "Modules\$ModuleName"
} else {
    Write-Host "[7/7] Skipping BOM removal (remove-bom.php not found)..." -ForegroundColor Yellow
}

# 8. Régénérer l'autoload Composer
Write-Host "[8/8] Regenerating composer autoload..." -ForegroundColor Yellow
composer dump-autoload -q

# 9. Activer le module
Write-Host "[9/9] Enabling module..." -ForegroundColor Yellow
php artisan module:enable $ModuleName

# Optionnel : Vider le cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Module created successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Module Structure:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Modules\$ModuleName\" -ForegroundColor White
Write-Host "  |-- Config\            (Configuration files)" -ForegroundColor Gray
Write-Host "  |-- Database\" -ForegroundColor White
Write-Host "  |     |-- migrations\  (Database migrations)" -ForegroundColor Gray
Write-Host "  |     |-- Seeders\     (Database seeders)" -ForegroundColor Gray
Write-Host "  |     +-- factories\   (Model factories)" -ForegroundColor Gray
Write-Host "  |-- Entities\          (Models - TENANT tables)" -ForegroundColor Gray
Write-Host "  |-- Http\" -ForegroundColor White
Write-Host "  |     +-- Controllers\" -ForegroundColor White
Write-Host "  |           |-- Admin\         (Tenant DB)" -ForegroundColor Gray
Write-Host "  |           |-- Superadmin\    (Central DB)" -ForegroundColor Gray
Write-Host "  |           +-- Frontend\      (Tenant DB)" -ForegroundColor Gray
Write-Host "  |-- Providers\         (Service providers)" -ForegroundColor Gray
Write-Host "  |-- Repositories\      (Repository pattern)" -ForegroundColor Gray
Write-Host "  |-- Resources\" -ForegroundColor White
Write-Host "  |     |-- views\       (Blade templates)" -ForegroundColor Gray
Write-Host "  |     |-- lang\        (Translations)" -ForegroundColor Gray
Write-Host "  |     +-- assets\      (JS/CSS assets)" -ForegroundColor Gray
Write-Host "  |-- Routes\" -ForegroundColor White
Write-Host "  |     |-- admin.php          [auth:sanctum, tenant]" -ForegroundColor Gray
Write-Host "  |     |-- superadmin.php     [auth:sanctum]" -ForegroundColor Gray
Write-Host "  |     |-- frontend.php       [tenant]" -ForegroundColor Gray
Write-Host "  |     |-- api.php            (API routes)" -ForegroundColor Gray
Write-Host "  |     +-- web.php            (Web routes)" -ForegroundColor Gray
Write-Host "  +-- Tests\             (Unit and Feature tests)" -ForegroundColor Gray
Write-Host ""
Write-Host "Routes available:" -ForegroundColor Yellow
Write-Host "  Admin (Protected + Tenant DB):" -ForegroundColor Cyan
Write-Host "    - GET    /api/admin/$moduleLower" -ForegroundColor White
Write-Host "    - POST   /api/admin/$moduleLower" -ForegroundColor White
Write-Host "    - GET    /api/admin/$moduleLower/{id}" -ForegroundColor White
Write-Host "    - PUT    /api/admin/$moduleLower/{id}" -ForegroundColor White
Write-Host "    - DELETE /api/admin/$moduleLower/{id}" -ForegroundColor White
Write-Host ""
Write-Host "  Superadmin (Protected + Central DB):" -ForegroundColor Cyan
Write-Host "    - GET    /api/superadmin/$moduleLower" -ForegroundColor White
Write-Host "    - POST   /api/superadmin/$moduleLower" -ForegroundColor White
Write-Host "    - GET    /api/superadmin/$moduleLower/{id}" -ForegroundColor White
Write-Host "    - PUT    /api/superadmin/$moduleLower/{id}" -ForegroundColor White
Write-Host "    - DELETE /api/superadmin/$moduleLower/{id}" -ForegroundColor White
Write-Host ""
Write-Host "  Frontend (Public + Tenant DB):" -ForegroundColor Cyan
Write-Host "    - GET    /api/frontend/$moduleLower" -ForegroundColor White
Write-Host "    - GET    /api/frontend/$moduleLower/{id}" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Create models in Modules\$ModuleName\Entities\" -ForegroundColor White
Write-Host "  2. Create repositories in Modules\$ModuleName\Repositories\" -ForegroundColor White
Write-Host "  3. Create database migrations" -ForegroundColor White
Write-Host "  4. Implement your business logic in controllers" -ForegroundColor White
Write-Host "  5. Add validation rules and form requests" -ForegroundColor White
Write-Host "  6. Write tests for your module" -ForegroundColor White
Write-Host ""
Write-Host "Testing your module:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:8000/api/admin/$moduleLower" -ForegroundColor White
Write-Host "  curl http://localhost:8000/api/superadmin/$moduleLower" -ForegroundColor White
Write-Host "  curl http://localhost:8000/api/frontend/$moduleLower" -ForegroundColor White
Write-Host ""
