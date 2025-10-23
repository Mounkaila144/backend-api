# Tutoriel Complet : Migration Symfony 1 vers Laravel 11 API + Next.js 15
## Architecture Modulaire Multi-Tenant avec Base de Données Existante

---

## 📋 Table des Matières

1. [Introduction et Architecture Multi-Tenant](#1-introduction-et-architecture-multi-tenant)
2. [Prérequis et Installation](#2-prérequis-et-installation)
3. [Création du Backend Laravel 11 API](#3-création-du-backend-laravel-11-api)
4. [Configuration Multi-Tenancy](#4-configuration-multi-tenancy)
5. [Configuration Base de Données Multi-Tenant](#5-configuration-base-de-données-multi-tenant)
6. [Installation Architecture Modulaire](#6-installation-architecture-modulaire)
7. [Création des Modèles (Central vs Tenant)](#7-création-des-modèles-central-vs-tenant)
8. [Création du Module UsersGuard Multi-Tenant](#8-création-du-module-usersguard-multi-tenant)
9. [Configuration Authentification Multi-Tenant (Sanctum)](#9-configuration-authentification-multi-tenant-sanctum)
10. [Gestion des Sites (Superadmin)](#10-gestion-des-sites-superadmin)
11. [Création du Frontend Next.js Multi-Tenant](#11-création-du-frontend-nextjs-multi-tenant)
12. [Optimisations pour Millions de Données](#12-optimisations-pour-millions-de-données)
13. [Migration des Autres Modules](#13-migration-des-autres-modules)
14. [Tests et Déploiement Multi-Tenant](#14-tests-et-déploiement-multi-tenant)

---

## 1. Introduction et Architecture Multi-Tenant

### 🎯 Objectif

Migrer votre application Symfony 1 modulaire vers une architecture moderne **Laravel 11 API + Next.js 15 Multi-Tenant**, tout en:
- ✅ **Architecture Multi-Tenant avec bases séparées** (une DB par site)
- ✅ **Gardant vos bases de données existantes intactes** (aucune modification des tables)
- ✅ **Préservant l'architecture modulaire** (modules indépendants)
- ✅ **Séparant les layers** (admin, superadmin, frontend)
- ✅ **Gérant des millions de données** (optimisations performance)

### 🏗️ Architecture Multi-Tenant de Votre Système

Votre système actuel utilise une architecture **multi-tenant avec séparation par base de données** :

```
┌─────────────────────────────────────────────────┐
│         Base Superadmin (Centrale)              │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │ t_sites                             │       │
│  ├─────────────────────────────────────┤       │
│  │ site1.com → db_site1 (localhost)    │ ──────┼──→ DB: db_site1
│  │ site2.com → db_site2 (localhost)    │ ──────┼──→ DB: db_site2
│  │ site3.com → db_site3 (server2)      │ ──────┼──→ DB: db_site3
│  └─────────────────────────────────────┘       │
│                                                 │
│  t_users (superadmin users)                    │
│  t_groups, t_permissions (superadmin)          │
└─────────────────────────────────────────────────┘
     ↓                    ↓                    ↓
┌──────────┐      ┌──────────┐        ┌──────────┐
│ db_site1 │      │ db_site2 │        │ db_site3 │
│          │      │          │        │          │
│ t_users  │      │ t_users  │        │ t_users  │
│ t_groups │      │ t_groups │        │ t_groups │
│ ...      │      │ ...      │        │ ...      │
└──────────┘      └──────────┘        └──────────┘
```

### 📊 Architecture Finale Laravel

```
C:\xampp\htdocs\
├── backend-api/                        # Laravel 11 (API REST Multi-Tenant)
│   ├── app/
│   │   ├── Models/
│   │   │   ├── Tenant.php             # 🎯 Modèle Site (base centrale)
│   │   │   └── User.php               # Modèle User (central + tenant)
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/
│   │   │   │   │   ├── AuthController.php        # Auth multi-tenant
│   │   │   │   │   └── SiteController.php        # Gestion sites
│   │   │   └── Middleware/
│   │   │       └── InitializeTenancy.php         # 🎯 Switch DB par site
│   │   └── Providers/
│   │       └── TenancyServiceProvider.php        # 🎯 Config tenancy
│   │
│   ├── Modules/                        # 🎯 Architecture modulaire
│   │   ├── UsersGuard/
│   │   │   ├── Entities/              # Modèles (tables tenant)
│   │   │   ├── Http/Controllers/
│   │   │   │   ├── Admin/             # 🔹 Routes admin (tenant DB)
│   │   │   │   ├── Superadmin/        # 🔹 Routes superadmin (central DB)
│   │   │   │   └── Frontend/          # 🔹 Routes frontend (tenant DB)
│   │   │   ├── Repositories/
│   │   │   └── Routes/
│   │   │       ├── admin.php          # Tenant routes
│   │   │       ├── superadmin.php     # Central routes
│   │   │       └── frontend.php       # Tenant routes
│   │   ├── ServerSiteManager/
│   │   └── ...
│   │
│   ├── config/
│   │   └── tenancy.php                # 🎯 Configuration multi-tenancy
│   └── .env                            # Config DB centrale

├── frontend-nextjs/                    # Next.js 15 (UI Multi-Tenant)
│   ├── app/
│   │   ├── select-site/               # 🎯 Sélection du site
│   │   ├── (auth)/login/
│   │   ├── admin/
│   │   ├── superadmin/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── api/
│   │   └── tenant-context.tsx         # 🎯 Context React tenant
│   └── .env.local

└── databases/                          # Vos bases existantes
    ├── base_superadmin/                # Base centrale
    ├── db_site1/                       # Site 1
    ├── db_site2/                       # Site 2
    └── ...
```

### 🔄 Flux de Fonctionnement

```
1. Utilisateur accède à l'application
   ↓
2. Frontend : Sélection du site (site1.com, site2.com, etc.)
   ↓
3. Frontend : Login avec header X-Tenant-ID
   ↓
4. Laravel : Middleware InitializeTenancy
   - Récupère site_id depuis header
   - Cherche dans t_sites (base centrale)
   - Configure connexion vers db_siteX
   ↓
5. Laravel : Switch vers base tenant
   - DB::setDefaultConnection('tenant')
   ↓
6. Contrôleurs : Utilisent la base du tenant
   ↓
7. Frontend : Affiche données du site sélectionné
```

---

## 2. Prérequis et Installation

### ✅ Vérifier les prérequis

```bash
# PHP 8.2 ou supérieur
php -v

# Composer 2.x
composer --version

# Node.js 18+ et npm
node -v
npm -v

# Redis (recommandé pour cache multi-tenant)
redis-cli ping  # Devrait retourner "PONG"
```

### 📦 Installer Redis (si pas installé)

**Windows:**
```bash
# Télécharger Redis depuis:
# https://github.com/microsoftarchive/redis/releases
# Ou utiliser Chocolatey:
choco install redis-64

# Démarrer Redis
redis-server
```

**Vérifier Redis:**
```bash
redis-cli ping
# Réponse attendue: PONG
```

---

## 3. Création du Backend Laravel 11 API

### 🚀 Étape 3.1 : Créer le projet Laravel

```bash
# Aller dans votre dossier racine
cd C:\xampp\htdocs

# Créer le projet Laravel 11
composer create-project laravel/laravel backend-api

# Entrer dans le projet
cd backend-api
```

**Sortie attendue:**
```
Creating a "laravel/laravel" project at "./backend-api"
...
Application ready! Build something amazing.
```

### 🔧 Étape 3.2 : Installer les packages essentiels

```bash
# Authentication API (tokens)
composer require laravel/sanctum

# Architecture modulaire (CRUCIAL)
composer require nwidart/laravel-modules

# Multi-tenancy (CRUCIAL pour votre système)
composer require stancl/tenancy

# Query builder avancé
composer require spatie/laravel-query-builder
```

### 📝 Étape 3.3 : Publier les configurations

```bash
# Publier config Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Publier config Modules
php artisan vendor:publish --provider="Nwidart\Modules\LaravelModulesServiceProvider"

# Publier config Tenancy
php artisan vendor:publish --provider='Stancl\Tenancy\TenancyServiceProvider'
```

### ✅ Vérification

```bash
# Vérifier que Laravel fonctionne
php artisan --version
# Output: Laravel Framework 11.x.x

# Vérifier les configs
dir config\tenancy.php
dir config\modules.php
```

---

## 4. Configuration Multi-Tenancy

### 🎯 Étape 4.1 : Créer le Modèle Tenant

Créez `backend-api/app/Models/Tenant.php`:

```php
<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * ⚠️ IMPORTANT: Utiliser votre table existante t_sites
     */
    protected $table = 't_sites';

    /**
     * Clé primaire
     */
    protected $primaryKey = 'site_id';

    /**
     * Connexion à la base centrale
     */
    protected $connection = 'mysql';

    /**
     * Pas de timestamps Laravel (votre table n'en a peut-être pas)
     */
    public $timestamps = false;

    /**
     * Colonnes modifiables
     */
    protected $fillable = [
        'site_host',
        'site_db_name',
        'site_db_login',
        'site_db_password',
        'site_db_host',
        'site_admin_theme',
        'site_frontend_theme',
        'site_available',
    ];

    /**
     * Configuration dynamique de la base de données tenant
     */
    public function database(): array
    {
        return [
            'driver' => 'mysql',
            'host' => $this->site_db_host,
            'database' => $this->site_db_name,
            'username' => $this->site_db_login,
            'password' => $this->site_db_password,
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
            'engine' => null,
        ];
    }

    /**
     * Méthodes helper
     */
    public function getDatabaseName(): string
    {
        return $this->site_db_name;
    }

    public function getDomain(): string
    {
        return $this->site_host;
    }

    public function isAvailable(): bool
    {
        return $this->site_available === 'YES';
    }

    /**
     * Scope pour sites disponibles uniquement
     */
    public function scopeAvailable($query)
    {
        return $query->where('site_available', 'YES');
    }
}
```

### 🔧 Étape 4.2 : Créer le TenancyServiceProvider

Créez `backend-api/app/Providers/TenancyServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class TenancyServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Événement : Initialisation du tenant (switch DB)
        Event::listen(
            \Stancl\Tenancy\Events\TenancyInitialized::class,
            function ($event) {
                $tenant = $event->tenancy->tenant;

                // Configuration dynamique de la connexion tenant
                config([
                    'database.connections.tenant' => [
                        'driver' => 'mysql',
                        'host' => $tenant->site_db_host,
                        'port' => 3306,
                        'database' => $tenant->site_db_name,
                        'username' => $tenant->site_db_login,
                        'password' => $tenant->site_db_password,
                        'charset' => 'utf8mb4',
                        'collation' => 'utf8mb4_unicode_ci',
                        'prefix' => '',
                        'strict' => true,
                        'engine' => null,
                        'options' => extension_loaded('pdo_mysql') ? array_filter([
                            \PDO::ATTR_PERSISTENT => true,
                            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,
                        ]) : [],
                    ],
                ]);

                // Purger et reconnecter
                DB::purge('tenant');
                DB::reconnect('tenant');

                // Définir comme connexion par défaut
                DB::setDefaultConnection('tenant');

                // Logger pour debug
                if (config('app.debug')) {
                    logger()->info("Tenancy initialized", [
                        'tenant_id' => $tenant->site_id,
                        'host' => $tenant->site_host,
                        'database' => $tenant->site_db_name,
                    ]);
                }
            }
        );

        // Événement : Fin du tenant (retour à central)
        Event::listen(
            \Stancl\Tenancy\Events\TenancyEnded::class,
            function () {
                // Revenir à la connexion centrale
                DB::setDefaultConnection('mysql');

                if (config('app.debug')) {
                    logger()->info("Tenancy ended, switched back to central DB");
                }
            }
        );

        // Événement : Création d'un nouveau tenant
        Event::listen(
            \Stancl\Tenancy\Events\TenantCreated::class,
            function ($event) {
                logger()->info("Tenant created", [
                    'tenant_id' => $event->tenant->site_id,
                    'host' => $event->tenant->site_host,
                ]);
            }
        );
    }
}
```

**Enregistrer le provider dans `config/app.php`:**

Éditez `backend-api/config/app.php`:

```php
'providers' => ServiceProvider::defaultProviders()->merge([
    /*
     * Package Service Providers...
     */

    /*
     * Application Service Providers...
     */
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,
    // App\Providers\BroadcastServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
    App\Providers\TenancyServiceProvider::class,  // 🎯 AJOUTER
])->toArray(),
```

### 🛡️ Étape 4.3 : Créer le Middleware Tenancy

Créez `backend-api/app/Http/Middleware/InitializeTenancy.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancy
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Option 1: Identifier par header X-Tenant-ID (recommandé pour API)
        if ($request->hasHeader('X-Tenant-ID')) {
            $tenantId = $request->header('X-Tenant-ID');
            $tenant = Tenant::where('site_id', $tenantId)
                ->where('site_available', 'YES')
                ->first();
        }
        // Option 2: Identifier par domaine (Host header)
        else {
            $domain = $request->getHost();
            $tenant = Tenant::where('site_host', $domain)
                ->where('site_available', 'YES')
                ->first();
        }

        // Vérifier si le tenant existe
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'error' => 'Tenant not found or unavailable',
                'hint' => 'Please provide X-Tenant-ID header or valid domain',
            ], 404);
        }

        // Initialiser le contexte tenant
        tenancy()->initialize($tenant);

        // Exécuter la requête
        $response = $next($request);

        // Terminer le contexte tenant
        tenancy()->end();

        return $response;
    }
}
```

**Enregistrer le middleware dans `bootstrap/app.php`:**

Éditez `backend-api/bootstrap/app.php`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Enregistrer l'alias tenant
        $middleware->alias([
            'tenant' => \App\Http\Middleware\InitializeTenancy::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

---

## 5. Configuration Base de Données Multi-Tenant

### 🔧 Étape 5.1 : Configuration .env

Éditez `backend-api/.env`:

```env
APP_NAME="Multi-Tenant API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# 🎯 CONNEXION CENTRALE (Base Superadmin avec t_sites)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=base_superadmin          # ⚠️ Votre base centrale avec t_sites
DB_USERNAME=root
DB_PASSWORD=                          # ⚠️ Votre mot de passe MySQL

# Cache Redis (CRUCIAL pour multi-tenant)
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Configuration API
API_PREFIX=api/v1
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000

# CORS pour Next.js
FRONTEND_URL=http://localhost:3000

# Configuration Tenancy
TENANCY_DATABASE_CONNECTION=mysql
TENANCY_IDENTIFICATION=domain
```

### 🧪 Étape 5.2 : Tester la connexion à la base centrale

Créez `backend-api/test-central-db.php`:

```php
<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Tester connexion centrale
    $pdo = DB::connection('mysql')->getPdo();
    echo "✅ Connexion à la base CENTRALE réussie!\n";

    // Vérifier que t_sites existe
    $tables = DB::connection('mysql')->select('SHOW TABLES');
    $tableNames = array_map(fn($t) => array_values((array) $t)[0], $tables);

    if (in_array('t_sites', $tableNames)) {
        echo "✅ Table t_sites trouvée!\n\n";

        // Lister les sites
        $sites = DB::connection('mysql')->table('t_sites')->get();
        echo "📋 Sites dans la base:\n";
        foreach ($sites as $site) {
            echo "  - {$site->site_host} → {$site->site_db_name} ({$site->site_available})\n";
        }
    } else {
        echo "⚠️  Table t_sites non trouvée. Voici les tables disponibles:\n";
        foreach (array_slice($tableNames, 0, 10) as $table) {
            echo "  - $table\n";
        }
    }

} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
```

**Exécuter:**
```bash
php test-central-db.php
```

**Sortie attendue:**
```
✅ Connexion à la base CENTRALE réussie!
✅ Table t_sites trouvée!

📋 Sites dans la base:
  - site1.example.com → db_site1 (YES)
  - site2.example.com → db_site2 (YES)
```

**Supprimer le test:**
```bash
del test-central-db.php
```

### 🔧 Étape 5.3 : Configuration CORS

Éditez `backend-api/config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['X-Tenant-ID'],  // 🎯 Exposer le header tenant

    'max_age' => 0,

    'supports_credentials' => true,
];
```

### 🔧 Étape 5.4 : Configuration Sanctum

Éditez `backend-api/config/sanctum.php`:

```php
<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
```

---

## 6. Installation Architecture Modulaire

### 🎯 Étape 6.1 : Configuration du système de modules

Éditez `backend-api/config/modules.php`:

```php
<?php

return [
    'namespace' => 'Modules',

    'stubs' => [
        'enabled' => false,
        'path' => base_path('vendor/nwidart/laravel-modules/src/Commands/stubs'),
    ],

    'paths' => [
        'modules' => base_path('Modules'),
        'assets' => public_path('modules'),
        'migration' => base_path('database/migrations'),

        'generator' => [
            'config' => ['path' => 'Config', 'generate' => true],
            'controller' => ['path' => 'Http/Controllers', 'generate' => true],
            'filter' => ['path' => 'Http/Middleware', 'generate' => true],
            'request' => ['path' => 'Http/Requests', 'generate' => true],
            'provider' => ['path' => 'Providers', 'generate' => true],
            'assets' => ['path' => 'Resources/assets', 'generate' => false],
            'lang' => ['path' => 'Resources/lang', 'generate' => false],
            'views' => ['path' => 'Resources/views', 'generate' => false],
            'test' => ['path' => 'Tests/Unit', 'generate' => true],
            'test-feature' => ['path' => 'Tests/Feature', 'generate' => true],
            'repository' => ['path' => 'Repositories', 'generate' => true],
            'event' => ['path' => 'Events', 'generate' => false],
            'listener' => ['path' => 'Listeners', 'generate' => false],
            'policies' => ['path' => 'Policies', 'generate' => false],
            'rules' => ['path' => 'Rules', 'generate' => false],
            'jobs' => ['path' => 'Jobs', 'generate' => false],
            'emails' => ['path' => 'Emails', 'generate' => false],
            'notifications' => ['path' => 'Notifications', 'generate' => false],
            'resource' => ['path' => 'Http/Resources', 'generate' => true],
            'model' => ['path' => 'Entities', 'generate' => true],
        ],
    ],

    'composer' => [
        'vendor' => 'modules',
        'author' => [
            'name' => 'Your Name',
            'email' => 'your@email.com',
        ],
    ],

    'cache' => [
        'enabled' => false,
        'key' => 'laravel-modules',
        'lifetime' => 60,
    ],

    'register' => [
        'translations' => true,
        'files' => 'register',
    ],

    'activators' => [
        'file' => [
            'class' => Nwidart\Modules\Activators\FileActivator::class,
            'statuses-file' => base_path('modules_statuses.json'),
            'cache-key' => 'activator.installed',
            'cache-lifetime' => 604800,
        ],
    ],

    'activator' => 'file',
];
```

### 🔧 Étape 6.2 : Script de création de modules

Créez `backend-api/create-module.ps1`:

```powershell
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

Route::prefix('admin')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::prefix('$($ModuleName.ToLower())')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
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

Route::prefix('superadmin')->middleware(['auth:sanctum'])->group(function () {
    Route::prefix('$($ModuleName.ToLower())')->group(function () {
        Route::get('/', [IndexController::class, 'index']);
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

Route::prefix('frontend')->middleware(['tenant'])->group(function () {
    Route::prefix('$($ModuleName.ToLower())')->group(function () {
        // Public routes
        Route::get('/', [IndexController::class, 'index']);

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            // Routes authentifiées
        });
    });
});
"@

# Créer les fichiers
$adminRoute | Out-File -FilePath "Modules\$ModuleName\Routes\admin.php" -Encoding UTF8
$superadminRoute | Out-File -FilePath "Modules\$ModuleName\Routes\superadmin.php" -Encoding UTF8
$frontendRoute | Out-File -FilePath "Modules\$ModuleName\Routes\frontend.php" -Encoding UTF8

Write-Host ""
Write-Host "✅ Multi-tenant module $ModuleName created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Structure:" -ForegroundColor Cyan
Write-Host "Modules\$ModuleName\"
Write-Host "├── Entities/          # Modèles (tables TENANT)"
Write-Host "├── Http\"
Write-Host "│   ├── Controllers\"
Write-Host "│   │   ├── Admin\         # 🔹 Tenant DB"
Write-Host "│   │   ├── Superadmin\    # 🔹 Central DB"
Write-Host "│   │   └── Frontend\      # 🔹 Tenant DB"
Write-Host "└── Routes\"
Write-Host "    ├── admin.php          # middleware: ['tenant']"
Write-Host "    ├── superadmin.php     # NO tenant middleware"
Write-Host "    └── frontend.php       # middleware: ['tenant']"
```

---

## 7. Création des Modèles (Central vs Tenant)

### 🎯 Architecture des Modèles

```
CENTRAL DATABASE (base_superadmin)
├── App\Models\Tenant (t_sites)
└── App\Models\User (t_users superadmin uniquement)

TENANT DATABASES (db_site1, db_site2, etc.)
├── Modules\UsersGuard\Entities\User (t_users du site)
├── Modules\UsersGuard\Entities\Group (t_groups du site)
└── Modules\UsersGuard\Entities\Permission (t_permissions du site)
```

### 📝 Étape 7.1 : Modèle User Central (Superadmin)

Éditez `backend-api/app/Models/User.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Modèle User pour SUPERADMIN uniquement (base centrale)
 * Pour les users des tenants, voir Modules\UsersGuard\Entities\User
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Table dans la base CENTRALE
     */
    protected $table = 't_users';

    /**
     * Connexion à la base centrale
     */
    protected $connection = 'mysql';

    /**
     * Pas de timestamps Laravel
     */
    public $timestamps = false;

    /**
     * Colonnes modifiables
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'firstname',
        'lastname',
        'application',
        'is_active',
    ];

    /**
     * Colonnes cachées
     */
    protected $hidden = [
        'password',
        'salt',
    ];

    /**
     * Cast des types
     */
    protected $casts = [
        'is_active' => 'boolean',
        'lastlogin' => 'datetime',
    ];

    /**
     * Scope : Uniquement les superadmin
     */
    public function scopeSuperadmin($query)
    {
        return $query->where('application', 'superadmin');
    }

    /**
     * Scope : Actifs uniquement
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
```

---

## 8. Création du Module UsersGuard Multi-Tenant

### 🚀 Étape 8.1 : Créer le module

```bash
cd C:\xampp\htdocs\backend-api

# Créer le module avec le script
.\create-module.ps1 UsersGuard
```

### 📝 Étape 8.2 : Créer les modèles Tenant

#### User (Tenant)

```bash
php artisan module:make-model User UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Entities/User.php`:

```php
<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Modèle User pour les TENANTS (base du site)
 * Différent de App\Models\User (superadmin)
 */
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * Table dans la base TENANT
     */
    protected $table = 't_users';

    /**
     * Connexion TENANT (dynamique)
     */
    protected $connection = 'tenant';

    /**
     * Pas de timestamps Laravel
     */
    public $timestamps = false;

    /**
     * Colonnes modifiables
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'firstname',
        'lastname',
        'application',
        'is_active',
        'sex',
        'phone',
        'mobile',
    ];

    /**
     * Colonnes cachées
     */
    protected $hidden = [
        'password',
        'salt',
    ];

    /**
     * Cast des types
     */
    protected $casts = [
        'is_active' => 'boolean',
        'lastlogin' => 'datetime',
    ];

    /**
     * Relations
     */
    public function groups()
    {
        return $this->belongsToMany(
            Group::class,
            't_user_group',
            'user_id',
            'group_id'
        );
    }

    public function permissions()
    {
        return $this->belongsToMany(
            Permission::class,
            't_user_permission',
            'user_id',
            'permission_id'
        );
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }

    public function scopeByApplication($query, $application)
    {
        return $query->where('application', $application);
    }
}
```

#### Group (Tenant)

```bash
php artisan module:make-model Group UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Entities/Group.php`:

```php
<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $table = 't_groups';
    protected $connection = 'tenant';  // 🎯 Connexion tenant
    public $timestamps = false;

    protected $fillable = [
        'name',
        'application',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relations
     */
    public function users()
    {
        return $this->belongsToMany(
            User::class,
            't_user_group',
            'group_id',
            'user_id'
        );
    }

    public function permissions()
    {
        return $this->belongsToMany(
            Permission::class,
            't_group_permission',
            'group_id',
            'permission_id'
        );
    }

    /**
     * Scopes
     */
    public function scopeByApplication($query, $application)
    {
        return $query->where('application', $application);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
```

#### Permission (Tenant)

```bash
php artisan module:make-model Permission UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Entities/Permission.php`:

```php
<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $table = 't_permissions';
    protected $connection = 'tenant';  // 🎯 Connexion tenant
    public $timestamps = false;

    protected $fillable = [
        'name',
        'application',
        'permission_group_id',
    ];

    /**
     * Relations
     */
    public function groups()
    {
        return $this->belongsToMany(
            Group::class,
            't_group_permission',
            'permission_id',
            'group_id'
        );
    }

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            't_user_permission',
            'permission_id',
            'user_id'
        );
    }

    /**
     * Scopes
     */
    public function scopeByApplication($query, $application)
    {
        return $query->where('application', $application);
    }
}
```

### 📦 Étape 8.3 : Repository

Créez `backend-api/Modules/UsersGuard/Repositories/GroupRepository.php`:

```php
<?php

namespace Modules\UsersGuard\Repositories;

use Modules\UsersGuard\Entities\Group;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GroupRepository
{
    protected $model;

    public function __construct(Group $model)
    {
        $this->model = $model;
    }

    /**
     * Get paginated groups with filters
     * Utilise automatiquement la base TENANT
     */
    public function getPaginated($filters = [], $perPage = 50)
    {
        $query = $this->model->query();

        // Filter by application
        if (isset($filters['application'])) {
            $query->where('application', $filters['application']);
        }

        // Search by name
        if (isset($filters['search'])) {
            $query->where('name', 'LIKE', "%{$filters['search']}%");
        }

        // Active only
        if (isset($filters['active'])) {
            $query->where('is_active', 1);
        }

        // Eager load relations
        $query->with(['permissions']);

        return $query->paginate($perPage);
    }

    /**
     * Find group with all relations
     */
    public function findWithRelations($id)
    {
        return $this->model
            ->with(['users', 'permissions'])
            ->findOrFail($id);
    }

    /**
     * Create new group
     */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /**
     * Update group
     */
    public function update($id, array $data)
    {
        $group = $this->model->findOrFail($id);
        $group->update($data);

        return $group->fresh();
    }

    /**
     * Delete group
     */
    public function delete($id)
    {
        $group = $this->model->findOrFail($id);
        return $group->delete();
    }

    /**
     * Sync permissions to group
     */
    public function syncPermissions($groupId, array $permissionIds)
    {
        $group = $this->model->findOrFail($groupId);
        $group->permissions()->sync($permissionIds);

        // Clear cache (tenant-specific)
        $tenantId = tenancy()->tenant?->site_id;
        Cache::forget("tenant.{$tenantId}.group.{$groupId}.permissions");

        return $group->load('permissions');
    }
}
```

### 🎮 Étape 8.4 : Contrôleurs Multi-Tenant

#### Admin Controller (Tenant DB)

```bash
php artisan module:make-controller Admin/GroupController UsersGuard --api
```

Éditez `backend-api/Modules/UsersGuard/Http/Controllers/Admin/GroupController.php`:

```php
<?php

namespace Modules\UsersGuard\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\UsersGuard\Repositories\GroupRepository;
use Modules\UsersGuard\Http\Resources\GroupResource;

/**
 * Gestion des groupes ADMIN (base TENANT)
 */
class GroupController extends Controller
{
    protected $groupRepository;

    public function __construct(GroupRepository $groupRepository)
    {
        $this->groupRepository = $groupRepository;
    }

    /**
     * Display a listing of groups
     * GET /api/admin/groups
     * Middleware: ['auth:sanctum', 'tenant']
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['application', 'search', 'active']);
        $perPage = $request->get('per_page', 50);

        $groups = $this->groupRepository->getPaginated($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => GroupResource::collection($groups->items()),
            'meta' => [
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'total' => $groups->total(),
            ],
            'tenant' => [
                'id' => tenancy()->tenant->site_id,
                'host' => tenancy()->tenant->site_host,
            ],
        ]);
    }

    /**
     * Store a newly created group
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'application' => 'required|in:admin,frontend',
        ]);

        $group = $this->groupRepository->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Group created successfully',
            'data' => new GroupResource($group),
        ], 201);
    }

    /**
     * Display the specified group
     */
    public function show($id): JsonResponse
    {
        $group = $this->groupRepository->findWithRelations($id);

        return response()->json([
            'success' => true,
            'data' => new GroupResource($group),
        ]);
    }

    /**
     * Update the specified group
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'application' => 'required|in:admin,frontend',
        ]);

        $group = $this->groupRepository->update($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Group updated successfully',
            'data' => new GroupResource($group),
        ]);
    }

    /**
     * Remove the specified group
     */
    public function destroy($id): JsonResponse
    {
        $this->groupRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Group deleted successfully',
        ]);
    }
}
```

#### Superadmin Controller (Central DB)

```bash
php artisan module:make-controller Superadmin/GroupController UsersGuard --api
```

Éditez `backend-api/Modules/UsersGuard/Http/Controllers/Superadmin/GroupController.php`:

```php
<?php

namespace Modules\UsersGuard\Http\Controllers\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

/**
 * Gestion des groupes SUPERADMIN (base CENTRALE)
 * Accès aux groupes de tous les tenants pour supervision
 */
class GroupController extends Controller
{
    /**
     * Lister les groupes de tous les tenants
     * GET /api/superadmin/groups
     */
    public function index(Request $request): JsonResponse
    {
        // Récupérer tous les sites
        $sites = DB::connection('mysql')
            ->table('t_sites')
            ->where('site_available', 'YES')
            ->get();

        $allGroups = [];

        // Pour chaque site, se connecter et récupérer les groupes
        foreach ($sites as $site) {
            try {
                // Configuration temporaire
                config([
                    'database.connections.temp_tenant' => [
                        'driver' => 'mysql',
                        'host' => $site->site_db_host,
                        'database' => $site->site_db_name,
                        'username' => $site->site_db_login,
                        'password' => $site->site_db_password,
                        'charset' => 'utf8mb4',
                    ],
                ]);

                DB::purge('temp_tenant');

                // Récupérer les groupes de ce site
                $groups = DB::connection('temp_tenant')
                    ->table('t_groups')
                    ->select('id', 'name', 'application')
                    ->limit(10)
                    ->get();

                $allGroups[] = [
                    'site_id' => $site->site_id,
                    'site_host' => $site->site_host,
                    'groups_count' => $groups->count(),
                    'groups' => $groups,
                ];

            } catch (\Exception $e) {
                $allGroups[] = [
                    'site_id' => $site->site_id,
                    'site_host' => $site->site_host,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $allGroups,
        ]);
    }

    /**
     * Statistiques globales
     * GET /api/superadmin/groups/stats
     */
    public function stats(): JsonResponse
    {
        $sites = DB::connection('mysql')
            ->table('t_sites')
            ->where('site_available', 'YES')
            ->get();

        $stats = [
            'total_sites' => $sites->count(),
            'total_groups' => 0,
        ];

        foreach ($sites as $site) {
            try {
                config([
                    'database.connections.temp_tenant' => [
                        'driver' => 'mysql',
                        'host' => $site->site_db_host,
                        'database' => $site->site_db_name,
                        'username' => $site->site_db_login,
                        'password' => $site->site_db_password,
                    ],
                ]);

                DB::purge('temp_tenant');

                $count = DB::connection('temp_tenant')
                    ->table('t_groups')
                    ->count();

                $stats['total_groups'] += $count;

            } catch (\Exception $e) {
                // Skip site si erreur
            }
        }

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
```

### 🎨 Étape 8.5 : API Resources

```bash
php artisan module:make-resource GroupResource UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Http/Resources/GroupResource.php`:

```php
<?php

namespace Modules\UsersGuard\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'application' => $this->application,
            'is_active' => (bool) $this->is_active,

            // Relations conditionnelles
            'permissions' => PermissionResource::collection($this->whenLoaded('permissions')),
            'users_count' => $this->when(
                $this->relationLoaded('users'),
                fn() => $this->users->count()
            ),

            // Info tenant (si disponible)
            'tenant' => $this->when(
                tenancy()->initialized,
                fn() => [
                    'id' => tenancy()->tenant->site_id,
                    'host' => tenancy()->tenant->site_host,
                ]
            ),
        ];
    }
}
```

```bash
php artisan module:make-resource PermissionResource UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Http/Resources/PermissionResource.php`:

```php
<?php

namespace Modules\UsersGuard\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'application' => $this->application,
            'permission_group_id' => $this->permission_group_id,
        ];
    }
}
```

### 🛣️ Étape 8.6 : Configurer les routes

Éditez `backend-api/Modules/UsersGuard/Routes/admin.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Admin\GroupController;

/*
|--------------------------------------------------------------------------
| Admin API Routes (TENANT DATABASE)
|--------------------------------------------------------------------------
| Middleware: ['auth:sanctum', 'tenant']
*/

Route::prefix('admin')->middleware(['auth:sanctum', 'tenant'])->group(function () {

    // Groups management
    Route::prefix('groups')->group(function () {
        Route::get('/', [GroupController::class, 'index']);
        Route::post('/', [GroupController::class, 'store']);
        Route::get('/{id}', [GroupController::class, 'show']);
        Route::put('/{id}', [GroupController::class, 'update']);
        Route::delete('/{id}', [GroupController::class, 'destroy']);
    });
});
```

Éditez `backend-api/Modules/UsersGuard/Routes/superadmin.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Superadmin\GroupController;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Middleware: ['auth:sanctum'] - PAS de middleware tenant
*/

Route::prefix('superadmin')->middleware(['auth:sanctum'])->group(function () {

    // Groups overview (tous les tenants)
    Route::prefix('groups')->group(function () {
        Route::get('/', [GroupController::class, 'index']);
        Route::get('/stats', [GroupController::class, 'stats']);
    });
});
```

---

## 9. Configuration Authentification Multi-Tenant (Sanctum)

### 🔐 Étape 9.1 : Créer le contrôleur d'authentification

Créez `backend-api/app/Http/Controllers/Api/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User as SuperadminUser;
use Modules\UsersGuard\Entities\User as TenantUser;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login SUPERADMIN (base centrale)
     * POST /api/superadmin/auth/login
     */
    public function loginSuperadmin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Chercher dans la base CENTRALE
        $user = SuperadminUser::superadmin()
            ->active()
            ->where('username', $validated['username'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials'],
            ]);
        }

        // Créer token
        $token = $user->createToken('superadmin-token', ['role:superadmin'])->plainTextToken;

        // Mettre à jour last login
        DB::connection('mysql')->table('t_users')
            ->where('id', $user->id)
            ->update(['lastlogin' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Superadmin login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'application' => $user->application,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Login TENANT (base du site)
     * POST /api/auth/login
     * Header requis: X-Tenant-ID
     */
    public function loginTenant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'application' => 'required|in:admin,frontend',
        ]);

        // Le middleware 'tenant' a déjà initialisé la connexion
        // On cherche donc dans la base TENANT

        $user = TenantUser::where('username', $validated['username'])
            ->where('application', $validated['application'])
            ->active()
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials'],
            ]);
        }

        // Créer token avec le tenant_id
        $token = $user->createToken('tenant-token', [
            'role:' . $validated['application'],
            'tenant:' . tenancy()->tenant->site_id,
        ])->plainTextToken;

        // Charger les relations
        $user->load(['groups.permissions', 'permissions']);

        // Mettre à jour last login
        DB::connection('tenant')->table('t_users')
            ->where('id', $user->id)
            ->update(['lastlogin' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'application' => $user->application,
                    'groups' => $user->groups,
                    'permissions' => $user->permissions,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
                'tenant' => [
                    'id' => tenancy()->tenant->site_id,
                    'host' => tenancy()->tenant->site_host,
                    'database' => tenancy()->tenant->site_db_name,
                ],
            ],
        ]);
    }

    /**
     * Get current user (superadmin ou tenant)
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Déterminer si c'est un superadmin ou tenant user
        $isSuperadmin = $user->application === 'superadmin';

        if (!$isSuperadmin && tenancy()->initialized) {
            // User tenant : charger les relations
            $user->load(['groups.permissions', 'permissions']);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'tenant' => $isSuperadmin ? null : [
                    'id' => tenancy()->tenant?->site_id,
                    'host' => tenancy()->tenant?->site_host,
                ],
            ],
        ]);
    }

    /**
     * Logout
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Refresh token
     * POST /api/auth/refresh
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Déterminer les abilities
        $abilities = [];
        if ($user->application === 'superadmin') {
            $abilities = ['role:superadmin'];
        } else {
            $abilities = [
                'role:' . $user->application,
                'tenant:' . tenancy()->tenant?->site_id,
            ];
        }

        // Révoquer l'ancien token
        $request->user()->currentAccessToken()->delete();

        // Créer nouveau token
        $token = $user->createToken('refreshed-token', $abilities)->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }
}
```

### 🛣️ Étape 9.2 : Configurer les routes d'authentification

Éditez `backend-api/routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SiteController;

/*
|--------------------------------------------------------------------------
| API Routes Multi-Tenant
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Multi-Tenant API is running',
        'timestamp' => now()->toIso8601String(),
        'database' => [
            'central' => config('database.connections.mysql.database'),
        ],
    ]);
});

/*
|--------------------------------------------------------------------------
| Routes CENTRALES (Superadmin - Base Centrale)
|--------------------------------------------------------------------------
*/

Route::prefix('superadmin')->group(function () {

    // Auth superadmin (public)
    Route::post('/auth/login', [AuthController::class, 'loginSuperadmin']);

    // Routes protégées superadmin
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);

        // Gestion des sites/tenants
        Route::prefix('sites')->group(function () {
            Route::get('/', [SiteController::class, 'index']);
            Route::post('/', [SiteController::class, 'store']);
            Route::get('/{id}', [SiteController::class, 'show']);
            Route::put('/{id}', [SiteController::class, 'update']);
            Route::delete('/{id}', [SiteController::class, 'destroy']);
            Route::post('/{id}/test-connection', [SiteController::class, 'testConnection']);
        });
    });
});

/*
|--------------------------------------------------------------------------
| Routes TENANT (Base du Site)
|--------------------------------------------------------------------------
| Middleware 'tenant' : Switch vers la base du site
*/

// Auth tenant (public avec header X-Tenant-ID)
Route::middleware(['tenant'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'loginTenant']);
});

// Routes protégées tenant
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Les routes des modules seront chargées automatiquement
    // via Modules/*/Routes/*.php
});
```

---

## 10. Gestion des Sites (Superadmin)

### 🏢 Étape 10.1 : Créer le SiteController

Créez `backend-api/app/Http/Controllers/Api/SiteController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class SiteController extends Controller
{
    /**
     * Lister tous les sites
     * GET /api/superadmin/sites
     */
    public function index(Request $request): JsonResponse
    {
        $sites = Tenant::select([
                'site_id',
                'site_host',
                'site_db_name',
                'site_db_host',
                'site_available',
                'site_admin_theme',
                'site_frontend_theme'
            ])
            ->when($request->get('search'), function ($query, $search) {
                $query->where('site_host', 'LIKE', "%{$search}%");
            })
            ->when($request->get('available'), function ($query) {
                $query->where('site_available', 'YES');
            })
            ->orderBy('site_host')
            ->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $sites->items(),
            'meta' => [
                'current_page' => $sites->currentPage(),
                'total' => $sites->total(),
                'per_page' => $sites->perPage(),
                'last_page' => $sites->lastPage(),
            ],
        ]);
    }

    /**
     * Afficher un site
     * GET /api/superadmin/sites/{id}
     */
    public function show($id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'site_id' => $site->site_id,
                'site_host' => $site->site_host,
                'site_db_name' => $site->site_db_name,
                'site_db_host' => $site->site_db_host,
                'site_db_login' => $site->site_db_login,
                'site_available' => $site->site_available,
                'site_admin_theme' => $site->site_admin_theme,
                'site_frontend_theme' => $site->site_frontend_theme,
            ],
        ]);
    }

    /**
     * Créer un nouveau site (avec sa base de données)
     * POST /api/superadmin/sites
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_host' => 'required|string|unique:t_sites,site_host',
            'site_db_name' => 'required|string|unique:t_sites,site_db_name',
            'site_db_login' => 'required|string',
            'site_db_password' => 'required|string',
            'site_db_host' => 'required|string',
            'site_admin_theme' => 'nullable|string',
            'site_frontend_theme' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // 1. Créer la base de données du site
            $this->createTenantDatabase($validated);

            // 2. Créer l'entrée dans t_sites
            $site = Tenant::create([
                'site_host' => $validated['site_host'],
                'site_db_name' => $validated['site_db_name'],
                'site_db_login' => $validated['site_db_login'],
                'site_db_password' => $validated['site_db_password'],
                'site_db_host' => $validated['site_db_host'],
                'site_admin_theme' => $validated['site_admin_theme'] ?? 'default',
                'site_frontend_theme' => $validated['site_frontend_theme'] ?? 'default',
                'site_available' => 'YES',
            ]);

            // 3. Créer les tables de base dans le tenant
            // Note: Vous pouvez copier la structure depuis un template
            $this->setupTenantTables($site);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Site created successfully',
                'data' => $site,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create site: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour un site
     * PUT /api/superadmin/sites/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        $validated = $request->validate([
            'site_host' => 'sometimes|string|unique:t_sites,site_host,' . $id . ',site_id',
            'site_available' => 'sometimes|in:YES,NO',
            'site_admin_theme' => 'sometimes|string',
            'site_frontend_theme' => 'sometimes|string',
        ]);

        $site->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Site updated successfully',
            'data' => $site,
        ]);
    }

    /**
     * Supprimer un site
     * DELETE /api/superadmin/sites/{id}
     */
    public function destroy($id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        // Optionnel: Supprimer aussi la base de données
        // ATTENTION: Cette opération est irréversible!
        if (request()->get('delete_database') === true) {
            try {
                DB::statement("DROP DATABASE IF EXISTS `{$site->site_db_name}`");
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete database: ' . $e->getMessage(),
                ], 500);
            }
        }

        $site->delete();

        return response()->json([
            'success' => true,
            'message' => 'Site deleted successfully',
        ]);
    }

    /**
     * Tester la connexion à un site
     * POST /api/superadmin/sites/{id}/test-connection
     */
    public function testConnection($id): JsonResponse
    {
        $site = Tenant::findOrFail($id);

        try {
            // Tester la connexion PDO
            $pdo = new \PDO(
                "mysql:host={$site->site_db_host};dbname={$site->site_db_name}",
                $site->site_db_login,
                $site->site_db_password
            );

            // Compter les tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            // Compter les users si la table existe
            $usersCount = 0;
            if (in_array('t_users', $tables)) {
                $stmt = $pdo->query("SELECT COUNT(*) FROM t_users");
                $usersCount = $stmt->fetchColumn();
            }

            return response()->json([
                'success' => true,
                'message' => 'Connection successful',
                'data' => [
                    'database' => $site->site_db_name,
                    'host' => $site->site_db_host,
                    'tables_count' => count($tables),
                    'users_count' => $usersCount,
                    'tables' => $tables,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer la base de données du tenant
     */
    protected function createTenantDatabase(array $data): void
    {
        $dbName = $data['site_db_name'];

        // Créer la base de données
        DB::connection('mysql')->statement(
            "CREATE DATABASE IF NOT EXISTS `{$dbName}`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        // Créer l'utilisateur MySQL (si différent de root)
        if ($data['site_db_login'] !== 'root') {
            $user = $data['site_db_login'];
            $password = $data['site_db_password'];
            $host = $data['site_db_host'];

            DB::connection('mysql')->statement(
                "CREATE USER IF NOT EXISTS '{$user}'@'{$host}'
                IDENTIFIED BY '{$password}'"
            );

            DB::connection('mysql')->statement(
                "GRANT ALL PRIVILEGES ON `{$dbName}`.*
                TO '{$user}'@'{$host}'"
            );

            DB::connection('mysql')->statement("FLUSH PRIVILEGES");
        }
    }

    /**
     * Créer les tables de base dans le tenant
     * Option: Copier depuis un template ou utiliser vos fichiers SQL
     */
    protected function setupTenantTables(Tenant $site): void
    {
        // Configuration temporaire
        config([
            'database.connections.new_tenant' => [
                'driver' => 'mysql',
                'host' => $site->site_db_host,
                'database' => $site->site_db_name,
                'username' => $site->site_db_login,
                'password' => $site->site_db_password,
                'charset' => 'utf8mb4',
            ],
        ]);

        DB::purge('new_tenant');

        // Option 1: Exécuter un fichier SQL template
        // $sql = file_get_contents(base_path('database/tenant_template.sql'));
        // DB::connection('new_tenant')->unprepared($sql);

        // Option 2: Créer les tables manuellement (exemple)
        DB::connection('new_tenant')->statement("
            CREATE TABLE IF NOT EXISTS `t_users` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `username` varchar(255) NOT NULL,
                `email` varchar(255) NOT NULL,
                `password` varchar(255) NOT NULL,
                `firstname` varchar(100) DEFAULT NULL,
                `lastname` varchar(100) DEFAULT NULL,
                `application` varchar(50) NOT NULL,
                `is_active` tinyint(1) DEFAULT 1,
                PRIMARY KEY (`id`),
                UNIQUE KEY `username` (`username`,`application`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Ajouter d'autres tables selon vos besoins...
    }
}
```

---

## 11. Création du Frontend Next.js Multi-Tenant

### 🚀 Étape 11.1 : Créer le projet Next.js

```bash
cd C:\xampp\htdocs

# Créer le projet
npx create-next-app@latest frontend-nextjs
```

**Options:**
```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … Yes
✔ Would you like to use App Router? … Yes
✔ Would you like to customize the default import alias? … No
```

### 📦 Étape 11.2 : Installer les dépendances

```bash
cd frontend-nextjs

npm install axios
npm install @tanstack/react-query
npm install react-hook-form
npm install --save-dev @types/node
```

### 🔧 Étape 11.3 : Configuration environnement

Créez `frontend-nextjs/.env.local`:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 📝 Étape 11.4 : Context Tenant

Créez `frontend-nextjs/src/lib/tenant-context.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tenant {
  id: number;
  host: string;
  name: string;
  database: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  clearTenant: () => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  setTenant: () => {},
  clearTenant: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<Tenant | null>(null);

  useEffect(() => {
    // Charger le tenant depuis localStorage au démarrage
    const storedTenant = localStorage.getItem('tenant');
    if (storedTenant) {
      try {
        setTenantState(JSON.parse(storedTenant));
      } catch (e) {
        console.error('Failed to parse tenant from localStorage', e);
        localStorage.removeItem('tenant');
      }
    }
  }, []);

  const setTenant = (newTenant: Tenant | null) => {
    if (newTenant) {
      localStorage.setItem('tenant', JSON.stringify(newTenant));
      setTenantState(newTenant);
    } else {
      localStorage.removeItem('tenant');
      setTenantState(null);
    }
  };

  const clearTenant = () => {
    localStorage.removeItem('tenant');
    setTenantState(null);
  };

  return (
    <TenantContext.Provider value={{ tenant, setTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
```

### 📝 Étape 11.5 : Client API Multi-Tenant

Créez `frontend-nextjs/src/lib/api/client.ts`:

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Ajouter le token
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 🎯 Ajouter le Tenant ID
        const tenant = this.getTenant();
        if (tenant && config.headers) {
          config.headers['X-Tenant-ID'] = tenant.id.toString();
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        if (error.response?.status === 404 && error.response?.data) {
          const data = error.response.data as any;
          if (data.error === 'Tenant not found or unavailable') {
            this.removeTenant();
            if (typeof window !== 'undefined') {
              window.location.href = '/select-site';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private getTenant(): { id: number } | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tenant');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }

  private removeTenant(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tenant');
    }
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient.getClient();
```

### 🔐 Étape 11.6 : Services d'authentification

Créez `frontend-nextjs/src/lib/api/services/auth.service.ts`:

```typescript
import api, { apiClient } from '../client';

export interface LoginCredentials {
  username: string;
  password: string;
  application?: 'admin' | 'frontend' | 'superadmin';
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  application: string;
  groups?: any[];
  permissions?: any[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    token_type: string;
    tenant?: {
      id: number;
      host: string;
      database: string;
    };
  };
}

export const authService = {
  /**
   * Login Superadmin (base centrale)
   */
  async loginSuperadmin(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/superadmin/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });

    apiClient.setToken(data.data.token);
    return data;
  },

  /**
   * Login Tenant (base du site)
   * Nécessite que le tenant soit déjà sélectionné (header X-Tenant-ID)
   */
  async loginTenant(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
      application: credentials.application || 'admin',
    });

    apiClient.setToken(data.data.token);
    return data;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      apiClient.setToken('');
    }
  },

  /**
   * Get current user
   */
  async me(): Promise<User> {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  },
};
```

### 🏢 Étape 11.7 : Service de gestion des sites

Créez `frontend-nextjs/src/lib/api/services/site.service.ts`:

```typescript
import api from '../client';

export interface Site {
  site_id: number;
  site_host: string;
  site_db_name: string;
  site_db_host: string;
  site_available: 'YES' | 'NO';
  site_admin_theme: string;
  site_frontend_theme: string;
}

export const siteService = {
  /**
   * Lister tous les sites (superadmin uniquement)
   */
  async getAllSites(): Promise<Site[]> {
    const { data } = await api.get('/superadmin/sites');
    return data.data;
  },

  /**
   * Obtenir un site spécifique
   */
  async getSite(id: number): Promise<Site> {
    const { data } = await api.get(`/superadmin/sites/${id}`);
    return data.data;
  },

  /**
   * Créer un nouveau site
   */
  async createSite(siteData: Partial<Site>): Promise<Site> {
    const { data } = await api.post('/superadmin/sites', siteData);
    return data.data;
  },

  /**
   * Tester la connexion à un site
   */
  async testConnection(id: number): Promise<any> {
    const { data } = await api.post(`/superadmin/sites/${id}/test-connection`);
    return data;
  },
};
```

### 📄 Étape 11.8 : Page de sélection du site

Créez `frontend-nextjs/src/app/select-site/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { siteService, Site } from '@/lib/api/services/site.service';
import { useTenant } from '@/lib/tenant-context';

export default function SelectSitePage() {
  const router = useRouter();
  const { setTenant } = useTenant();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError('');

      // Vérifier qu'on a un token superadmin
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/superadmin/login');
        return;
      }

      const data = await siteService.getAllSites();
      setSites(data);
    } catch (err: any) {
      console.error('Failed to load sites:', err);
      setError(
        err.response?.data?.message ||
        'Failed to load sites. Please login as superadmin first.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectSite = (site: Site) => {
    // Sauvegarder le tenant sélectionné
    setTenant({
      id: site.site_id,
      host: site.site_host,
      name: site.site_host,
      database: site.site_db_name,
    });

    // Rediriger vers le login du tenant
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select a Site</h1>
          <p className="text-gray-600">Choose which site you want to manage</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Sites Grid */}
        {sites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <button
                key={site.site_id}
                onClick={() => selectSite(site)}
                disabled={site.site_available !== 'YES'}
                className={`
                  bg-white p-6 rounded-lg shadow-md hover:shadow-xl
                  transition-all duration-200 text-left
                  ${site.site_available === 'YES'
                    ? 'hover:scale-105 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${site.site_available === 'YES'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }
                  `}>
                    {site.site_available === 'YES' ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {site.site_host}
                </h3>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Database:</span> {site.site_db_name}
                  </p>
                  <p>
                    <span className="font-medium">Host:</span> {site.site_db_host}
                  </p>
                </div>

                {site.site_available === 'YES' && (
                  <div className="mt-4 text-indigo-600 flex items-center text-sm font-medium">
                    Select this site
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No sites available</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 📄 Étape 11.9 : Page de login Superadmin

Créez `frontend-nextjs/src/app/superadmin/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginCredentials } from '@/lib/api/services/auth.service';

export default function SuperadminLoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.loginSuperadmin(credentials);
      console.log('Superadmin login successful:', response);

      // Rediriger vers la sélection de site
      router.push('/select-site');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-indigo-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Superadmin Login</h1>
          <p className="text-gray-600 mt-2">Access the central management system</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter superadmin username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Login as Superadmin'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 📄 Étape 11.10 : Page de login Tenant

Créez `frontend-nextjs/src/app/login/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginCredentials } from '@/lib/api/services/auth.service';
import { useTenant } from '@/lib/tenant-context';

export default function LoginPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    application: 'admin',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier qu'un tenant est sélectionné
    if (!tenant) {
      router.push('/select-site');
    }
  }, [tenant, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.loginTenant(credentials);
      console.log('Tenant login successful:', response);

      // Rediriger vers le dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        {/* Tenant Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-600 font-medium">Logging into:</p>
          <p className="text-lg font-bold text-blue-900">{tenant.host}</p>
          <p className="text-xs text-blue-600">Database: {tenant.database}</p>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Login
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application
            </label>
            <select
              value={credentials.application}
              onChange={(e) => setCredentials({
                ...credentials,
                application: e.target.value as any
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="admin">Admin</option>
              <option value="frontend">Frontend</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/select-site')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Change site
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 📝 Étape 11.11 : Wrapper avec TenantProvider

Éditez `frontend-nextjs/src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "@/lib/tenant-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multi-Tenant Application",
  description: "Multi-tenant management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
```

### 🚀 Étape 11.12 : Démarrer le frontend

```bash
cd C:\xampp\htdocs\frontend-nextjs

npm run dev
```

**Accès:**
- Login Superadmin: http://localhost:3000/superadmin/login
- Sélection Site: http://localhost:3000/select-site
- Login Tenant: http://localhost:3000/login

---

## 12. Optimisations pour Millions de Données

### 🚀 Étape 12.1 : Configuration MySQL optimisée

Éditez `backend-api/config/database.php`:

```php
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => true,
    'engine' => null,

    // 🚀 Optimisations pour millions de lignes
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        PDO::ATTR_PERSISTENT => true,
        PDO::ATTR_EMULATE_PREPARES => true,
        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,
        PDO::ATTR_TIMEOUT => 30,
    ]) : [],
],
```

### 🎯 Étape 12.2 : AppServiceProvider optimisé

Éditez `backend-api/app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // 🚀 Prévenir lazy loading (N+1 queries)
        Model::preventLazyLoading(!app()->isProduction());

        // 🚀 Prévenir silently discarding attributes
        Model::preventSilentlyDiscardingAttributes(!app()->isProduction());

        // 🚀 Log slow queries en production (> 1 seconde)
        if (app()->isProduction()) {
            DB::listen(function (QueryExecuted $query) {
                if ($query->time > 1000) {
                    logger()->warning('Slow query detected', [
                        'sql' => $query->sql,
                        'bindings' => $query->bindings,
                        'time' => $query->time . 'ms',
                        'connection' => $query->connectionName,
                        'tenant_id' => tenancy()->initialized ? tenancy()->tenant->site_id : null,
                    ]);
                }
            });
        }

        // 🚀 Prevent accessing missing attributes
        Model::preventAccessingMissingAttributes(!app()->isProduction());
    }
}
```

### 📊 Étape 12.3 : Utilisation de Cursors pour grandes requêtes

Exemple dans un repository:

```php
/**
 * Export all groups (millions de rows) sans limite mémoire
 */
public function exportAll()
{
    $file = fopen('groups_export.csv', 'w');
    fputcsv($file, ['ID', 'Name', 'Application', 'Tenant']);

    // 🚀 Cursor - pas de limite mémoire
    Group::cursor()->each(function ($group) use ($file) {
        fputcsv($file, [
            $group->id,
            $group->name,
            $group->application,
            tenancy()->tenant?->site_host ?? 'N/A',
        ]);
    });

    fclose($file);
}
```

### 🔄 Étape 12.4 : Chunking pour traitements batch

```php
/**
 * Traiter des millions d'utilisateurs par batch
 */
public function processAllUsers()
{
    // Traiter 1000 à la fois
    User::chunk(1000, function ($users) {
        foreach ($users as $user) {
            // Traitement
        }

        // Libérer mémoire
        if (function_exists('gc_collect_cycles')) {
            gc_collect_cycles();
        }
    });
}
```

### 💾 Étape 12.5 : Configuration Cache Redis Multi-Tenant

Éditez `backend-api/config/cache.php`:

```php
'default' => env('CACHE_DRIVER', 'redis'),

'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
        'lock_connection' => 'default',
    ],
],

// Préfixe avec tenant ID pour isolation
'prefix' => env('CACHE_PREFIX', function() {
    $base = Str::slug(env('APP_NAME', 'laravel'), '_');
    $tenantId = tenancy()->initialized ? tenancy()->tenant->site_id : 'central';
    return "{$base}_tenant_{$tenantId}_cache_";
}),
```

**Utilisation dans repositories:**

```php
use Illuminate\Support\Facades\Cache;

public function findWithCache($id)
{
    $tenantId = tenancy()->tenant?->site_id ?? 'central';
    $cacheKey = "tenant.{$tenantId}.group.{$id}";

    return Cache::remember($cacheKey, 3600, function () use ($id) {
        return Group::with('permissions')->findOrFail($id);
    });
}
```

---

## 13. Migration des Autres Modules

### 📋 Étape 13.1 : Liste des modules

Pour chaque module Symfony, suivez le même processus:

```bash
# Créer le module
.\create-module.ps1 NomDuModule

# Créer les modèles
php artisan module:make-model ModelName NomDuModule

# Créer les contrôleurs
php artisan module:make-controller Admin/ControllerName NomDuModule --api
php artisan module:make-controller Superadmin/ControllerName NomDuModule --api
```

### 🔄 Étape 13.2 : Checklist par module

```markdown
# Migration Module: [NOM]

## Analyse
- [ ] Lister tables (schema.sql)
- [ ] Déterminer si CENTRAL ou TENANT
- [ ] Lister fonctionnalités
- [ ] Identifier dépendances

## Structure
- [ ] Créer module: `.\create-module.ps1 [NOM]`
- [ ] Modèles Eloquent (connection: 'tenant' ou 'mysql')
- [ ] Repositories
- [ ] Form Requests

## Contrôleurs
- [ ] Admin (TENANT DB)
- [ ] Superadmin (CENTRAL DB)
- [ ] Frontend (TENANT DB)

## Routes
- [ ] Routes admin (middleware: ['tenant'])
- [ ] Routes superadmin (NO tenant middleware)
- [ ] Routes frontend (middleware: ['tenant'])

## Tests
- [ ] Test avec site 1
- [ ] Test avec site 2
- [ ] Test superadmin overview
```

---

## 14. Tests et Déploiement Multi-Tenant

### 🧪 Étape 14.1 : Script de test complet

Créez `backend-api/test-multi-tenancy.ps1`:

```powershell
# Test Multi-Tenancy Complet

$baseUrl = "http://localhost:8000/api"

Write-Host "🏢 Testing Multi-Tenant API..." -ForegroundColor Cyan
Write-Host ""

# 1. Health check
Write-Host "1️⃣ Health check..." -ForegroundColor Yellow
$healthResponse = Invoke-WebRequest -Uri "$baseUrl/health"
$healthResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host "✅ Health check passed" -ForegroundColor Green
Write-Host ""

# 2. Login Superadmin
Write-Host "2️⃣ Superadmin Login..." -ForegroundColor Yellow
$loginBody = @{
    username = "superadmin"
    password = "password"
} | ConvertTo-Json

try {
    $superadminResponse = Invoke-WebRequest -Uri "$baseUrl/superadmin/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $superadminData = $superadminResponse.Content | ConvertFrom-Json
    $superadminToken = $superadminData.data.token

    Write-Host "✅ Superadmin logged in" -ForegroundColor Green
    Write-Host "Token: $($superadminToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""

    # 3. List sites
    Write-Host "3️⃣ List all sites..." -ForegroundColor Yellow
    $sitesResponse = Invoke-WebRequest -Uri "$baseUrl/superadmin/sites" `
        -Headers @{Authorization = "Bearer $superadminToken"}

    $sites = ($sitesResponse.Content | ConvertFrom-Json).data
    Write-Host "Found $($sites.Count) sites" -ForegroundColor Gray

    foreach ($site in $sites) {
        Write-Host "  - [$($site.site_id)] $($site.site_host) → $($site.site_db_name) ($($site.site_available))" -ForegroundColor Gray
    }
    Write-Host ""

    # 4. Test sur un tenant
    if ($sites.Count -gt 0) {
        $firstSite = $sites[0]

        Write-Host "4️⃣ Login on tenant: $($firstSite.site_host)..." -ForegroundColor Yellow

        $tenantLoginBody = @{
            username = "admin"
            password = "password"
            application = "admin"
        } | ConvertTo-Json

        $tenantResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{"X-Tenant-ID" = $firstSite.site_id} `
            -Body $tenantLoginBody

        $tenantData = $tenantResponse.Content | ConvertFrom-Json
        $tenantToken = $tenantData.data.token

        Write-Host "✅ Tenant login successful" -ForegroundColor Green
        Write-Host "Tenant: $($tenantData.data.tenant.host)" -ForegroundColor Gray
        Write-Host "Database: $($tenantData.data.tenant.database)" -ForegroundColor Gray
        Write-Host ""

        # 5. Get groups from tenant
        Write-Host "5️⃣ Get groups from tenant..." -ForegroundColor Yellow
        $groupsResponse = Invoke-WebRequest -Uri "$baseUrl/admin/groups" `
            -Headers @{
                "Authorization" = "Bearer $tenantToken"
                "X-Tenant-ID" = $firstSite.site_id
            }

        $groupsData = $groupsResponse.Content | ConvertFrom-Json
        Write-Host "Total groups: $($groupsData.meta.total)" -ForegroundColor Gray
        Write-Host "Tenant: $($groupsData.tenant.host)" -ForegroundColor Gray
        Write-Host "✅ Groups retrieved" -ForegroundColor Green
        Write-Host ""

        # 6. Get user info
        Write-Host "6️⃣ Get current user info..." -ForegroundColor Yellow
        $meResponse = Invoke-WebRequest -Uri "$baseUrl/auth/me" `
            -Headers @{
                "Authorization" = "Bearer $tenantToken"
                "X-Tenant-ID" = $firstSite.site_id
            }

        $meData = $meResponse.Content | ConvertFrom-Json
        Write-Host "User: $($meData.data.user.username)" -ForegroundColor Gray
        Write-Host "Groups: $($meData.data.user.groups.Count)" -ForegroundColor Gray
        Write-Host "Permissions: $($meData.data.user.permissions.Count)" -ForegroundColor Gray
        Write-Host "✅ User info retrieved" -ForegroundColor Green
        Write-Host ""

        # 7. Logout tenant
        Write-Host "7️⃣ Logout from tenant..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri "$baseUrl/auth/logout" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $tenantToken"
                "X-Tenant-ID" = $firstSite.site_id
            } | Out-Null
        Write-Host "✅ Tenant logout successful" -ForegroundColor Green
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 All multi-tenancy tests completed!" -ForegroundColor Green
```

**Exécuter:**
```bash
.\test-multi-tenancy.ps1
```

### 📦 Étape 14.2 : Build production

**Backend:**
```bash
cd C:\xampp\htdocs\backend-api

# Optimiser caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Modifier .env pour production
# APP_ENV=production
# APP_DEBUG=false
```

**Frontend:**
```bash
cd C:\xampp\htdocs\frontend-nextjs

# Build
npm run build

# Test production
npm run start
```

---

## 📋 Récapitulatif Final

### ✅ Ce qui a été configuré

1. ✅ Laravel 11 API avec Multi-Tenancy (stancl/tenancy)
2. ✅ Architecture modulaire (nwidart/laravel-modules)
3. ✅ Base centrale (superadmin) + Bases tenant (sites)
4. ✅ Middleware de switch dynamique de DB
5. ✅ Authentification séparée (superadmin vs tenant)
6. ✅ Gestion des sites (SiteController)
7. ✅ Module UsersGuard multi-tenant
8. ✅ Frontend Next.js avec sélection de site
9. ✅ Optimisations pour millions de données
10. ✅ Scripts de test et déploiement

### 🎯 Flux Complet

```
1. Login Superadmin → Base Centrale
2. Sélection Site → Store tenant_id
3. Login Tenant → Header X-Tenant-ID
4. Middleware → Switch DB vers tenant
5. Contrôleurs → Utilisent DB tenant
6. Logout → Clear tenant
```

### 📚 Ressources

- **Laravel 11**: https://laravel.com/docs/11.x
- **Laravel Modules**: https://nwidart.com/laravel-modules
- **Stancl Tenancy**: https://tenancyforlaravel.com
- **Laravel Sanctum**: https://laravel.com/docs/11.x/sanctum
- **Next.js 15**: https://nextjs.org/docs

---

## 🎉 Vous êtes prêt!

Votre système multi-tenant est maintenant configuré avec:
- ✅ Séparation complète des bases de données par site
- ✅ Gestion centralisée des sites (superadmin)
- ✅ Architecture modulaire préservée
- ✅ Frontend moderne avec sélection de site
- ✅ Optimisations pour millions de données
- ✅ Isolation complète des tenants

**Bon développement! 🚀**