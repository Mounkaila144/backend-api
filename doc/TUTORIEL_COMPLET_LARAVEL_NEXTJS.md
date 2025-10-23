# Tutoriel Complet : Migration Symfony 1 vers Laravel 11 API + Next.js 15
## Architecture Modulaire Multi-Tenant avec Bases de Données Séparées

---

## ⚠️ IMPORTANT : Architecture Multi-Tenant

Votre système utilise une **architecture multi-tenant avec bases de données séparées**:
- Une base **superadmin** centrale contient la table `t_sites` (liste tous les sites)
- Chaque site/tenant a sa **propre base de données** séparée
- **Voir le fichier**: `TUTORIEL_MULTI_TENANCY_LARAVEL.md` pour la configuration complète

---

## 📋 Table des Matières

1. [Introduction et Architecture](#1-introduction-et-architecture)
2. [Prérequis et Installation](#2-prérequis-et-installation)
3. [Création du Backend Laravel 11 API](#3-création-du-backend-laravel-11-api)
4. [Configuration Base de Données Existante](#4-configuration-base-de-données-existante)
5. [Installation Architecture Modulaire](#5-installation-architecture-modulaire)
6. [Création des Modèles Eloquent](#6-création-des-modèles-eloquent)
7. [Création du Premier Module (UsersGuard)](#7-création-du-premier-module-usersguard)
8. [Configuration Authentification API (Sanctum)](#8-configuration-authentification-api-sanctum)
9. [Création du Frontend Next.js](#9-création-du-frontend-nextjs)
10. [Optimisations pour Millions de Données](#10-optimisations-pour-millions-de-données)
11. [Migration des Autres Modules](#11-migration-des-autres-modules)
12. [Tests et Déploiement](#12-tests-et-déploiement)
13. [🏢 Configuration Multi-Tenancy](#13-configuration-multi-tenancy) ⭐ NOUVEAU

---

## 1. Introduction et Architecture

### 🎯 Objectif

Migrer votre application Symfony 1 modulaire vers une architecture moderne **Laravel 11 API + Next.js 15**, tout en:
- ✅ **Gardant votre base de données existante intacte** (aucune modification des tables)
- ✅ **Préservant l'architecture modulaire** (modules indépendants)
- ✅ **Séparant les layers** (admin, superadmin, frontend)
- ✅ **Gérant des millions de données** (optimisations performance)

### 📊 Architecture Finale

```
C:\xampp\htdocs\
├── backend-api/              # Laravel 11 (API REST uniquement)
│   ├── app/
│   │   └── Models/
│   │       └── User.php      # Modèle de base partagé
│   ├── Modules/              # 🎯 Architecture modulaire
│   │   ├── UsersGuard/
│   │   │   ├── Entities/     # Modèles (tables existantes)
│   │   │   ├── Http/
│   │   │   │   └── Controllers/
│   │   │   │       ├── Admin/         # Routes admin
│   │   │   │       ├── Superadmin/    # Routes superadmin
│   │   │   │       └── Frontend/      # Routes frontend
│   │   │   ├── Repositories/ # Logique métier
│   │   │   ├── Routes/
│   │   │   │   ├── admin.php
│   │   │   │   ├── superadmin.php
│   │   │   │   └── frontend.php
│   │   │   └── module.json
│   │   ├── ServerSiteManager/
│   │   ├── AppDomoprime/
│   │   └── ...
│   └── .env                   # Config DB existante
│
├── frontend-nextjs/          # Next.js 15 (UI)
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── admin/
│   │   ├── superadmin/
│   │   └── dashboard/
│   ├── lib/
│   │   └── api/              # Client API
│   └── .env.local
│
└── project/                  # Ancien code Symfony (à garder temporairement)
    └── modules/
```

### 🔄 Comparaison Architecture

| Symfony 1 Actuel | Laravel 11 Équivalent | Description |
|-----------------|----------------------|-------------|
| `modules/users_guard/` | `Modules/UsersGuard/` | Module isolé |
| `superadmin/actions/` | `Http/Controllers/Superadmin/` | Contrôleurs superadmin |
| `admin/actions/` | `Http/Controllers/Admin/` | Contrôleurs admin |
| `frontend/` | `Http/Controllers/Frontend/` | Contrôleurs frontend |
| `common/lib/` | `Entities/` | Modèles Eloquent |
| `admin/locales/Forms/` | `Http/Requests/` | Validation |
| `superadmin/models/schema.sql` | Tables existantes (pas de migration) | Base de données |
| `admin/designs/templates/` | API JSON (pas de templates) | Frontend Next.js |

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

# Redis (recommandé pour cache)
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

# Query builder avancé (filtres, tri, pagination)
composer require spatie/laravel-query-builder

# Permissions et rôles (optionnel mais recommandé)
composer require spatie/laravel-permission
```

### 📝 Étape 3.3 : Publier les configurations

```bash
# Publier config Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Publier config Modules
php artisan vendor:publish --provider="Nwidart\Modules\LaravelModulesServiceProvider"

# Publier config Permissions (optionnel)
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

### ✅ Vérification

```bash
# Vérifier que Laravel fonctionne
php artisan --version
# Output: Laravel Framework 11.x.x

# Vérifier que le module système est installé
php artisan module:list
# Output: (liste vide pour l'instant)
```

---

## 4. Configuration Base de Données Existante

### ⚠️ IMPORTANT : Ne PAS modifier vos tables existantes

Laravel va se connecter à votre base MySQL existante **sans rien modifier**. Les modèles Eloquent vont utiliser vos tables telles quelles.

### 🔧 Étape 4.1 : Configuration .env

Éditez le fichier `backend-api/.env`:

```env
APP_NAME="Your App API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# 🎯 VOTRE BASE DE DONNÉES EXISTANTE
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=votre_base_existante    # ⚠️ REMPLACER par le nom de votre base
DB_USERNAME=root
DB_PASSWORD=                         # ⚠️ Votre mot de passe MySQL

# Cache Redis (CRUCIAL pour millions de données)
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
```

### 🧪 Étape 4.2 : Tester la connexion DB

Créez un fichier de test temporaire `backend-api/test-db-connection.php`:

```php
<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $pdo = DB::connection()->getPdo();
    echo "✅ Connexion à la base de données réussie!\n";

    // Lister quelques tables
    $tables = DB::select('SHOW TABLES');
    echo "\n📋 Tables trouvées:\n";
    foreach (array_slice($tables, 0, 10) as $table) {
        $tableName = array_values((array) $table)[0];
        echo "  - $tableName\n";
    }

} catch (\Exception $e) {
    echo "❌ Erreur de connexion: " . $e->getMessage() . "\n";
}
```

**Exécuter le test:**
```bash
php test-db-connection.php
```

**Sortie attendue:**
```
✅ Connexion à la base de données réussie!

📋 Tables trouvées:
  - t_users
  - t_groups
  - t_permissions
  - t_sessions
  ...
```

**Si ça fonctionne, supprimer le fichier:**
```bash
del test-db-connection.php
```

### 🔧 Étape 4.3 : Configuration CORS

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

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

### 🔧 Étape 4.4 : Configuration Sanctum

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

    'expiration' => null,  // Tokens n'expirent jamais (ou mettre 60 pour 60 minutes)

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
```

---

## 5. Installation Architecture Modulaire

### 🎯 Étape 5.1 : Configuration du système de modules

Le package `nwidart/laravel-modules` a déjà été installé. Maintenant, configurons-le.

Éditez `backend-api/config/modules.php` (déjà créé par la commande publish):

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

### 🧪 Étape 5.2 : Tester la création d'un module

```bash
# Créer un module de test
php artisan module:make TestModule

# Vérifier la structure créée
dir Modules\TestModule
```

**Structure attendue:**
```
Modules/TestModule/
├── Config/
├── Console/
├── Database/
├── Entities/
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   └── Requests/
├── Providers/
├── Resources/
├── Routes/
├── Tests/
├── composer.json
└── module.json
```

**Supprimer le module de test:**
```bash
php artisan module:delete TestModule
```

### 🔧 Étape 5.3 : Créer un script utilitaire pour générer des modules

Créez le fichier `backend-api/create-module.ps1`:

```powershell
# Script pour créer un module avec structure admin/superadmin/frontend
param(
    [Parameter(Mandatory=$true)]
    [string]$ModuleName
)

Write-Host "🚀 Creating module: $ModuleName" -ForegroundColor Green

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
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {
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
| Superadmin Routes
|--------------------------------------------------------------------------
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
| Frontend Routes (Public + Protected)
|--------------------------------------------------------------------------
*/

Route::prefix('frontend')->group(function () {
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

# Mettre à jour le Service Provider pour charger les routes
$providerPath = "Modules\$ModuleName\Providers\${ModuleName}ServiceProvider.php"
if (Test-Path $providerPath) {
    $content = Get-Content $providerPath -Raw

    # Ajouter le chargement des routes dans la méthode boot
    $routesLoading = @"

        // Charger les routes par layer
        `$this->loadRoutesFrom(__DIR__ . '/../Routes/admin.php');
        `$this->loadRoutesFrom(__DIR__ . '/../Routes/superadmin.php');
        `$this->loadRoutesFrom(__DIR__ . '/../Routes/frontend.php');
"@

    $content = $content -replace '(public function boot\(\)[^\{]*\{)', "`$1$routesLoading"
    $content | Out-File -FilePath $providerPath -Encoding UTF8 -NoNewline
}

Write-Host ""
Write-Host "✅ Module $ModuleName created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Structure:" -ForegroundColor Cyan
Write-Host "Modules\$ModuleName\"
Write-Host "├── Entities/          # Modèles Eloquent"
Write-Host "├── Http\"
Write-Host "│   ├── Controllers\"
Write-Host "│   │   ├── Admin\"
Write-Host "│   │   ├── Superadmin\"
Write-Host "│   │   └── Frontend\"
Write-Host "│   ├── Requests/      # Validation"
Write-Host "│   └── Resources/     # API Resources"
Write-Host "├── Repositories/      # Business logic"
Write-Host "└── Routes\"
Write-Host "    ├── admin.php"
Write-Host "    ├── superadmin.php"
Write-Host "    └── frontend.php"
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Create models: php artisan module:make-model ModelName $ModuleName"
Write-Host "2. Create repositories: php artisan module:make-repository ModelRepository $ModuleName"
Write-Host "3. Implement controllers in: Modules\$ModuleName\Http\Controllers\"
Write-Host "4. Enable module: php artisan module:enable $ModuleName"
```

**Rendre le script exécutable et tester:**
```powershell
# Tester la création d'un module
.\create-module.ps1 TestModule

# Vérifier
php artisan module:list

# Supprimer le test
php artisan module:delete TestModule
```

---

## 6. Création des Modèles Eloquent

Les modèles Eloquent vont utiliser vos tables existantes **sans les modifier**.

### 🎯 Étape 6.1 : Modèle User de base

Éditez `backend-api/app/Models/User.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * ⚠️ IMPORTANT: Utiliser votre table existante
     */
    protected $table = 't_users';

    /**
     * Désactiver les timestamps si vos tables n'ont pas created_at/updated_at
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
        'application',  // admin, frontend, superadmin
        'is_active',
        'sex',
        'phone',
        'mobile',
    ];

    /**
     * Colonnes cachées (ne pas exposer dans API)
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
        'last_password_gen' => 'datetime',
    ];

    /**
     * Relations
     */
    public function groups()
    {
        return $this->belongsToMany(
            \Modules\UsersGuard\Entities\Group::class,
            't_user_group',
            'user_id',
            'group_id'
        );
    }

    public function permissions()
    {
        return $this->belongsToMany(
            \Modules\UsersGuard\Entities\Permission::class,
            't_user_permission',
            'user_id',
            'permission_id'
        );
    }

    public function sessions()
    {
        return $this->hasMany(\Modules\UsersGuard\Entities\Session::class, 'user_id');
    }

    /**
     * Scopes pour filtrage
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

---

## 7. Création du Premier Module (UsersGuard)

Nous allons créer le module `UsersGuard` qui gère l'authentification et les permissions.

### 🚀 Étape 7.1 : Créer le module

```bash
cd C:\xampp\htdocs\backend-api

# Créer le module avec le script
.\create-module.ps1 UsersGuard
```

**Vérifier que le module est créé:**
```bash
php artisan module:list
```

**Output attendu:**
```
+------------+---------+
| Name       | Status  |
+------------+---------+
| UsersGuard | Enabled |
+------------+---------+
```

### 📝 Étape 7.2 : Créer les modèles (Entities)

#### Group.php

```bash
php artisan module:make-model Group UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Entities/Group.php`:

```php
<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Group extends Model
{
    protected $table = 't_groups';
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

#### Permission.php

```bash
php artisan module:make-model Permission UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Entities/Permission.php`:

```php
<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Permission extends Model
{
    protected $table = 't_permissions';
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

    public function permissionGroup()
    {
        return $this->belongsTo(PermissionGroup::class, 'permission_group_id');
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

#### Session.php

```bash
php artisan module:make-model Session UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Entities/Session.php`:

```php
<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Session extends Model
{
    protected $table = 't_sessions';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'session_id',
        'ip',
        'application',
        'last_time',
    ];

    protected $casts = [
        'last_time' => 'datetime',
    ];

    /**
     * Relations
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('last_time', '>', now()->subMinutes(30));
    }
}
```

### 📦 Étape 7.3 : Créer les Repositories (Business Logic)

Créez manuellement le fichier `backend-api/Modules/UsersGuard/Repositories/GroupRepository.php`:

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

        // Sync permissions (detach old, attach new)
        $group->permissions()->sync($permissionIds);

        // Clear cache
        Cache::forget("group.{$groupId}.permissions");

        return $group->load('permissions');
    }

    /**
     * Copy group with permissions
     */
    public function copy($id, $newName)
    {
        return DB::transaction(function () use ($id, $newName) {
            $original = $this->findWithRelations($id);

            // Create copy
            $copy = $this->create([
                'name' => $newName,
                'application' => $original->application,
            ]);

            // Copy permissions
            $permissionIds = $original->permissions->pluck('id')->toArray();
            $copy->permissions()->sync($permissionIds);

            return $copy->load('permissions');
        });
    }

    /**
     * Bulk delete groups
     */
    public function bulkDelete(array $ids)
    {
        return $this->model->whereIn('id', $ids)->delete();
    }

    /**
     * Get groups count by application
     */
    public function countByApplication()
    {
        return Cache::remember('groups.count.by_application', 3600, function () {
            return $this->model
                ->select('application', DB::raw('count(*) as count'))
                ->groupBy('application')
                ->get();
        });
    }
}
```

### 🎮 Étape 7.4 : Créer les contrôleurs

#### Admin/GroupController.php

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
use Modules\UsersGuard\Http\Requests\GroupRequest;
use Modules\UsersGuard\Http\Resources\GroupResource;

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
        ]);
    }

    /**
     * Store a newly created group
     * POST /api/admin/groups
     */
    public function store(GroupRequest $request): JsonResponse
    {
        $group = $this->groupRepository->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Group created successfully',
            'data' => new GroupResource($group),
        ], 201);
    }

    /**
     * Display the specified group
     * GET /api/admin/groups/{id}
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
     * PUT /api/admin/groups/{id}
     */
    public function update(GroupRequest $request, $id): JsonResponse
    {
        $group = $this->groupRepository->update($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Group updated successfully',
            'data' => new GroupResource($group),
        ]);
    }

    /**
     * Remove the specified group
     * DELETE /api/admin/groups/{id}
     */
    public function destroy($id): JsonResponse
    {
        $this->groupRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Group deleted successfully',
        ]);
    }

    /**
     * Sync permissions to group
     * POST /api/admin/groups/{id}/permissions
     */
    public function syncPermissions(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:t_permissions,id',
        ]);

        $group = $this->groupRepository->syncPermissions($id, $validated['permission_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Permissions synchronized successfully',
            'data' => new GroupResource($group),
        ]);
    }

    /**
     * Copy group
     * POST /api/admin/groups/{id}/copy
     */
    public function copy(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $group = $this->groupRepository->copy($id, $validated['name']);

        return response()->json([
            'success' => true,
            'message' => 'Group copied successfully',
            'data' => new GroupResource($group),
        ], 201);
    }
}
```

### 📋 Étape 7.5 : Créer les Form Requests (Validation)

```bash
php artisan module:make-request GroupRequest UsersGuard
```

Éditez `backend-api/Modules/UsersGuard/Http/Requests/GroupRequest.php`:

```php
<?php

namespace Modules\UsersGuard\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;  // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'name' => 'required|string|max:255',
            'application' => 'required|in:admin,frontend,superadmin',
        ];

        // For update, add unique constraint except for current record
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $groupId = $this->route('id');
            $rules['name'] .= "|unique:t_groups,name,{$groupId},id,application,{$this->application}";
        } else {
            $rules['name'] .= '|unique:t_groups,name,NULL,id,application,' . $this->application;
        }

        return $rules;
    }

    /**
     * Get custom error messages
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du groupe est obligatoire',
            'name.unique' => 'Ce nom de groupe existe déjà pour cette application',
            'name.max' => 'Le nom ne peut pas dépasser 255 caractères',
            'application.required' => "L'application est obligatoire",
            'application.in' => "L'application doit être admin, frontend ou superadmin",
        ];
    }
}
```

### 🎨 Étape 7.6 : Créer les API Resources (Transformers)

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
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'application' => $this->application,
            'is_active' => (bool) $this->is_active,

            // Conditional relations
            'permissions' => PermissionResource::collection($this->whenLoaded('permissions')),
            'users_count' => $this->when(
                $this->relationLoaded('users'),
                fn() => $this->users->count()
            ),

            // Timestamps (if exist)
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

Créez aussi `PermissionResource.php`:

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
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

### 🛣️ Étape 7.7 : Configurer les routes

Éditez `backend-api/Modules/UsersGuard/Routes/admin.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use Modules\UsersGuard\Http\Controllers\Admin\GroupController;

/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {

    // Groups management
    Route::prefix('groups')->group(function () {
        Route::get('/', [GroupController::class, 'index']);
        Route::post('/', [GroupController::class, 'store']);
        Route::get('/{id}', [GroupController::class, 'show']);
        Route::put('/{id}', [GroupController::class, 'update']);
        Route::delete('/{id}', [GroupController::class, 'destroy']);

        // Additional actions
        Route::post('/{id}/permissions', [GroupController::class, 'syncPermissions']);
        Route::post('/{id}/copy', [GroupController::class, 'copy']);
    });

    // TODO: Add more resources (permissions, users, etc.)
});
```

---

## 8. Configuration Authentification API (Sanctum)

### 🔐 Étape 8.1 : Créer le contrôleur d'authentification

Créez le fichier `backend-api/app/Http/Controllers/Api/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Modules\UsersGuard\Entities\Session;

class AuthController extends Controller
{
    /**
     * Login user and create token
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'application' => 'required|in:admin,frontend,superadmin',
        ]);

        // Find user
        $user = User::where('username', $validated['username'])
            ->where('application', $validated['application'])
            ->where('is_active', 1)
            ->first();

        // Check credentials
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Create API token
        $token = $user->createToken('api-token')->plainTextToken;

        // Log session (like your current system)
        Session::create([
            'user_id' => $user->id,
            'session_id' => $request->session()->getId(),
            'ip' => $request->ip(),
            'application' => $validated['application'],
            'last_time' => now(),
        ]);

        // Load relations
        $user->load(['groups.permissions', 'permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout user (revoke token)
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Get current authenticated user
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['groups.permissions', 'permissions']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Refresh token
     * POST /api/auth/refresh
     */
    public function refresh(Request $request): JsonResponse
    {
        // Revoke old token
        $request->user()->currentAccessToken()->delete();

        // Create new token
        $token = $request->user()->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
            ],
        ]);
    }
}
```

### 🛣️ Étape 8.2 : Configurer les routes d'authentification

Éditez `backend-api/routes/api.php`:

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()->toIso8601String(),
    ]);
});
```

### 🧪 Étape 8.3 : Tester l'API avec un utilisateur existant

```bash
# Démarrer le serveur Laravel
php artisan serve --port=8000
```

**Tester avec PowerShell:**
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object -ExpandProperty Content

# Login (remplacer avec vos credentials)
$body = @{
    username = "admin"
    password = "votre_password"
    application = "admin"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.Content

# Extraire le token
$data = $response.Content | ConvertFrom-Json
$token = $data.data.token

# Test route protégée
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/me" `
    -Headers @{Authorization = "Bearer $token"} |
    Select-Object -ExpandProperty Content
```

**Ou avec Postman/Insomnia:**

1. **POST** `http://localhost:8000/api/auth/login`
   ```json
   {
     "username": "admin",
     "password": "votre_password",
     "application": "admin"
   }
   ```

2. Copier le `token` de la réponse

3. **GET** `http://localhost:8000/api/auth/me`
   - Header: `Authorization: Bearer YOUR_TOKEN`

---

## 9. Création du Frontend Next.js

### 🚀 Étape 9.1 : Créer le projet Next.js

```bash
cd C:\xampp\htdocs

# Créer le projet
npx create-next-app@latest frontend-nextjs
```

**Options à choisir:**
```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … Yes
✔ Would you like to use App Router? … Yes
✔ Would you like to customize the default import alias? … No
```

### 📦 Étape 9.2 : Installer les dépendances

```bash
cd frontend-nextjs

# API client
npm install axios

# State management
npm install @tanstack/react-query

# Form handling
npm install react-hook-form

# Dev tools
npm install --save-dev @types/node
```

### 🔧 Étape 9.3 : Configuration environnement

Créez `frontend-nextjs/.env.local`:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Application type (admin, frontend, superadmin)
NEXT_PUBLIC_APP_TYPE=admin
```

### 📝 Étape 9.4 : Créer le client API

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

    // Request interceptor (add token)
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (handle errors)
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
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

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient.getClient();
```

### 🔐 Étape 9.5 : Créer le service d'authentification

Créez `frontend-nextjs/src/lib/api/services/auth.service.ts`:

```typescript
import apiClient from '../client';

export interface LoginCredentials {
  username: string;
  password: string;
  application: 'admin' | 'frontend' | 'superadmin';
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  application: string;
  groups: any[];
  permissions: any[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);

    // Store token
    apiClient.setToken(data.data.token);

    return data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    apiClient.setToken('');
  },

  /**
   * Get current user
   */
  async me(): Promise<User> {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  },
};
```

### 📄 Étape 9.6 : Créer la page de login

Créez `frontend-nextjs/src/app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginCredentials } from '@/lib/api/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    application: 'admin',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(credentials);
      console.log('Login successful:', response);

      // Redirect to dashboard
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Login
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
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

          {/* Password */}
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

          {/* Application */}
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
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 📄 Étape 9.7 : Créer le dashboard

Créez `frontend-nextjs/src/app/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/api/services/auth.service';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      const userData = await authService.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome, {user?.firstname}!</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info */}
            <div>
              <h3 className="text-lg font-medium mb-3">User Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Username:</dt>
                  <dd className="text-base font-medium">{user?.username}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Email:</dt>
                  <dd className="text-base font-medium">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Application:</dt>
                  <dd className="text-base font-medium capitalize">{user?.application}</dd>
                </div>
              </dl>
            </div>

            {/* Groups */}
            <div>
              <h3 className="text-lg font-medium mb-3">Groups</h3>
              {user?.groups && user.groups.length > 0 ? (
                <ul className="space-y-1">
                  {user.groups.map((group: any) => (
                    <li key={group.id} className="text-sm bg-blue-100 px-3 py-1 rounded">
                      {group.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No groups assigned</p>
              )}
            </div>

            {/* Permissions */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-3">Permissions</h3>
              {user?.permissions && user.permissions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {user.permissions.map((permission: any) => (
                    <div key={permission.id} className="text-sm bg-green-100 px-3 py-1 rounded">
                      {permission.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No permissions assigned</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 🚀 Étape 9.8 : Démarrer le frontend

```bash
cd C:\xampp\htdocs\frontend-nextjs

# Démarrer le serveur de développement
npm run dev
```

**Accéder à:**
- Frontend: http://localhost:3000
- Login: http://localhost:3000/login

---

## 10. Optimisations pour Millions de Données

### 🚀 Étape 10.1 : Configuration MySQL optimisée

Éditez `backend-api/config/database.php`:

```php
'mysql' => [
    'driver' => 'mysql',
    'url' => env('DATABASE_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => true,
    'engine' => null,

    // 🚀 Optimisations pour millions de lignes
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        PDO::ATTR_PERSISTENT => true,
        PDO::ATTR_EMULATE_PREPARES => true,
        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,  // Pour grandes requêtes
        PDO::ATTR_TIMEOUT => 30,
    ]) : [],
],
```

### 🎯 Étape 10.2 : Configuration AppServiceProvider

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
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
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
                    ]);
                }
            });
        }

        // 🚀 Default pagination
        Model::preventAccessingMissingAttributes(!app()->isProduction());
    }
}
```

### 📊 Étape 10.3 : Utiliser les Cursors pour grandes requêtes

Exemple d'export avec cursor (pas de limite mémoire):

```php
// Modules/UsersGuard/Repositories/GroupRepository.php

/**
 * Export all groups (millions of rows)
 */
public function exportAll()
{
    $file = fopen('groups_export.csv', 'w');

    fputcsv($file, ['ID', 'Name', 'Application']);

    // 🚀 Cursor au lieu de get() - pas de limite mémoire
    Group::cursor()->each(function ($group) use ($file) {
        fputcsv($file, [
            $group->id,
            $group->name,
            $group->application,
        ]);
    });

    fclose($file);
}
```

### 🔄 Étape 10.4 : Chunking pour traitements batch

```php
// Traiter 1000 utilisateurs à la fois
User::where('application', 'admin')
    ->chunk(1000, function ($users) {
        foreach ($users as $user) {
            // Traitement
        }

        // Libérer la mémoire (comme votre code avec gc_collect_cycles)
        if (function_exists('gc_collect_cycles')) {
            gc_collect_cycles();
        }
    });
```

### 💾 Étape 10.5 : Configuration Cache Redis

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

// ...

'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_cache_'),
```

**Utilisation dans les repositories:**

```php
use Illuminate\Support\Facades\Cache;

public function findWithCache($id)
{
    return Cache::remember("group.{$id}", 3600, function () use ($id) {
        return Group::with('permissions')->findOrFail($id);
    });
}
```

### 📈 Étape 10.6 : Indexation database

Vérifiez que vos tables ont des index:

```sql
-- Vérifier les index existants
SHOW INDEX FROM t_users;
SHOW INDEX FROM t_groups;
SHOW INDEX FROM t_permissions;

-- Ajouter des index si manquants (probablement déjà là)
CREATE INDEX idx_users_application ON t_users(application);
CREATE INDEX idx_users_username ON t_users(username);
CREATE INDEX idx_users_email ON t_users(email);
CREATE INDEX idx_users_active ON t_users(is_active);

CREATE INDEX idx_groups_application ON t_groups(application);
CREATE INDEX idx_permissions_application ON t_permissions(application);
```

---

## 11. Migration des Autres Modules

### 📋 Étape 11.1 : Liste des modules à migrer

Identifiez vos modules Symfony existants:

```bash
cd C:\xampp\htdocs\project
dir modules
```

**Exemple de modules typiques:**
- `users_guard` ✅ (déjà fait)
- `server_site_manager`
- `app_domoprime`
- `app_domoprime_multi`
- `customers_contracts_billing`
- `customers_meetings`
- etc.

### 🔄 Étape 11.2 : Processus de migration par module

Pour chaque module, suivez ces étapes:

**1. Créer le module Laravel:**
```bash
cd C:\xampp\htdocs\backend-api
.\create-module.ps1 ServerSiteManager
```

**2. Analyser le module Symfony:**
```bash
# Voir les tables
cat ..\project\modules\server_site_manager\superadmin\models\schema.sql

# Voir les actions
dir ..\project\modules\server_site_manager\admin\actions

# Voir les modèles
dir ..\project\modules\server_site_manager\common\lib
```

**3. Créer les modèles Eloquent:**
```bash
php artisan module:make-model Archive ServerSiteManager
php artisan module:make-model Site ServerSiteManager
```

**4. Créer les repositories:**
Créer manuellement dans `Modules/ServerSiteManager/Repositories/`

**5. Créer les contrôleurs:**
```bash
php artisan module:make-controller Admin/ArchiveController ServerSiteManager --api
php artisan module:make-controller Superadmin/ArchiveController ServerSiteManager --api
```

**6. Configurer les routes:**
Éditer `Modules/ServerSiteManager/Routes/*.php`

**7. Tester:**
```bash
# Tester avec Postman ou PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/api/admin/server-site-manager" `
    -Headers @{Authorization = "Bearer $token"}
```

### 📝 Étape 11.3 : Template de migration

Créez un fichier `backend-api/MIGRATION_CHECKLIST.md`:

```markdown
# Module Migration Checklist

## Module: [NOM_MODULE]

### Phase 1: Analyse
- [ ] Lister les tables (schema.sql)
- [ ] Lister les actions/contrôleurs
- [ ] Identifier les dépendances
- [ ] Documenter les fonctionnalités

### Phase 2: Structure
- [ ] Créer le module: `.\create-module.ps1 [NOM]`
- [ ] Créer les modèles Eloquent
- [ ] Créer les repositories
- [ ] Créer les form requests

### Phase 3: Contrôleurs
- [ ] Admin controllers
- [ ] Superadmin controllers
- [ ] Frontend controllers (si applicable)

### Phase 4: Routes
- [ ] Routes admin
- [ ] Routes superadmin
- [ ] Routes frontend

### Phase 5: Tests
- [ ] Test connexion DB
- [ ] Test endpoints API
- [ ] Test avec frontend Next.js

### Phase 6: Optimisations
- [ ] Eager loading
- [ ] Cache queries lourdes
- [ ] Indexation DB
- [ ] Chunking pour batch
```

---

## 12. Tests et Déploiement

### 🧪 Étape 12.1 : Tester l'API complète

**Script PowerShell de test complet:**

Créez `backend-api/test-api.ps1`:

```powershell
# Test complet de l'API

$baseUrl = "http://localhost:8000/api"

Write-Host "🧪 Testing API..." -ForegroundColor Cyan
Write-Host ""

# 1. Health check
Write-Host "1️⃣ Health check..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/health"
$response.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host "✅ Health check passed" -ForegroundColor Green
Write-Host ""

# 2. Login
Write-Host "2️⃣ Login..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin"
    application = "admin"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.data.token

    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""

    # 3. Get current user
    Write-Host "3️⃣ Get current user..." -ForegroundColor Yellow
    $meResponse = Invoke-WebRequest -Uri "$baseUrl/auth/me" `
        -Headers @{Authorization = "Bearer $token"}
    $meResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
    Write-Host "✅ User retrieved" -ForegroundColor Green
    Write-Host ""

    # 4. Get groups
    Write-Host "4️⃣ Get groups..." -ForegroundColor Yellow
    $groupsResponse = Invoke-WebRequest -Uri "$baseUrl/admin/groups" `
        -Headers @{Authorization = "Bearer $token"}
    $groupsData = $groupsResponse.Content | ConvertFrom-Json
    Write-Host "Total groups: $($groupsData.meta.total)" -ForegroundColor Gray
    Write-Host "✅ Groups retrieved" -ForegroundColor Green
    Write-Host ""

    # 5. Logout
    Write-Host "5️⃣ Logout..." -ForegroundColor Yellow
    $logoutResponse = Invoke-WebRequest -Uri "$baseUrl/auth/logout" `
        -Method POST `
        -Headers @{Authorization = "Bearer $token"}
    Write-Host "✅ Logout successful" -ForegroundColor Green

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 All tests completed!" -ForegroundColor Green
```

**Exécuter:**
```powershell
.\test-api.ps1
```

### 📦 Étape 12.2 : Vérifier tous les modules

```bash
# Lister tous les modules
php artisan module:list

# Vérifier qu'ils sont tous activés
php artisan module:enable --all
```

### 🚀 Étape 12.3 : Build production

**Backend:**
```bash
cd C:\xampp\htdocs\backend-api

# Optimiser
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Production .env
# Modifier APP_ENV=production, APP_DEBUG=false
```

**Frontend:**
```bash
cd C:\xampp\htdocs\frontend-nextjs

# Build
npm run build

# Test production
npm run start
```

### 🔒 Étape 12.4 : Sécurité

**Backend .env production:**
```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...  # Généré par php artisan key:generate

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=votre_base
DB_USERNAME=user_prod
DB_PASSWORD=password_secure

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

---

## 📋 Récapitulatif Final

### ✅ Ce qui a été fait

1. ✅ Backend Laravel 11 API créé
2. ✅ Architecture modulaire configurée (nwidart/laravel-modules)
3. ✅ Base de données existante connectée (pas de modification)
4. ✅ Module UsersGuard créé avec:
   - Modèles Eloquent
   - Repositories
   - Contrôleurs Admin/Superadmin/Frontend
   - Routes séparées par layer
   - Validation (Form Requests)
   - API Resources
5. ✅ Authentification API (Sanctum)
6. ✅ Frontend Next.js 15 créé
7. ✅ Login/Dashboard fonctionnels
8. ✅ Optimisations pour millions de données
9. ✅ Scripts utilitaires (create-module.ps1, test-api.ps1)

### 🎯 Structure Finale

```
C:\xampp\htdocs\
├── backend-api/                    # Laravel 11 API ✅
│   ├── Modules/
│   │   └── UsersGuard/            # Module complet ✅
│   │       ├── Entities/          # Modèles ✅
│   │       ├── Http/Controllers/
│   │       │   ├── Admin/         # ✅
│   │       │   ├── Superadmin/    # ✅
│   │       │   └── Frontend/      # ✅
│   │       ├── Repositories/      # ✅
│   │       └── Routes/            # ✅
│   ├── app/Models/User.php        # ✅
│   └── .env                       # ✅
│
├── frontend-nextjs/               # Next.js 15 ✅
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/            # ✅
│   │   │   └── dashboard/        # ✅
│   │   └── lib/api/              # ✅
│   └── .env.local                # ✅
│
└── project/                       # Ancien Symfony (garder)
    └── modules/
```

### 🚀 Prochaines Étapes

1. **Migrer les autres modules:**
   ```bash
   .\create-module.ps1 ServerSiteManager
   .\create-module.ps1 AppDomoprime
   # etc.
   ```

2. **Ajouter plus d'endpoints au module UsersGuard:**
   - Permissions CRUD
   - Users management
   - Sessions management

3. **Créer les pages Next.js correspondantes:**
   - Groups management UI
   - Permissions management UI
   - Users management UI

4. **Optimisations avancées:**
   - Queue system pour tâches lourdes
   - WebSockets pour notifications temps réel
   - Cache stratégies

### 📚 Ressources

- **Laravel 11**: https://laravel.com/docs/11.x
- **Laravel Modules**: https://nwidart.com/laravel-modules
- **Laravel Sanctum**: https://laravel.com/docs/11.x/sanctum
- **Next.js 15**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🆘 Support et Troubleshooting

### Problèmes courants

**1. Erreur de connexion DB:**
```bash
# Vérifier credentials
php artisan tinker
>>> DB::connection()->getPdo();
```

**2. Module non trouvé:**
```bash
# Régénérer l'autoload
composer dump-autoload
php artisan module:enable UsersGuard
```

**3. CORS errors:**
```bash
# Vérifier config/cors.php
# Vérifier FRONTEND_URL dans .env
```

**4. Token invalide:**
```bash
# Vérifier que Sanctum est bien configuré
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

---

## 13. Configuration Multi-Tenancy

### 🏢 Architecture Multi-Tenant avec Bases de Données Séparées

Votre système utilise une architecture **multi-tenant** où:
- Une base **superadmin** centrale contient `t_sites` (liste des sites + connexions DB)
- Chaque site a sa **propre base de données** séparée
- Les connexions se font dynamiquement selon le site identifié

### 📋 Structure de la Table t_sites

```sql
CREATE TABLE `t_sites` (
  `site_id` int(11) PRIMARY KEY AUTO_INCREMENT,
  `site_host` varchar(255) NOT NULL,        -- exemple.com
  `site_db_name` varchar(64) NOT NULL,      -- db_site_exemple
  `site_db_login` varchar(40) NOT NULL,     -- root
  `site_db_password` varchar(40) NOT NULL,  -- password
  `site_db_host` varchar(128) NOT NULL,     -- localhost
  `site_available` enum('YES','NO') NOT NULL,
  UNIQUE KEY `site_host` (`site_host`)
);
```

### 📖 Documentation Complète

**La configuration complète du multi-tenancy est documentée dans un fichier séparé:**

👉 **`TUTORIEL_MULTI_TENANCY_LARAVEL.md`**

Ce fichier contient:
- ✅ Installation de `stancl/tenancy`
- ✅ Configuration du modèle Tenant (utilise `t_sites`)
- ✅ Middleware pour identification des sites
- ✅ Routes séparées central/tenant
- ✅ Contrôleurs superadmin (gestion des sites)
- ✅ Authentification multi-tenant (superadmin + tenant)
- ✅ Frontend Next.js avec sélection de site
- ✅ Scripts de test multi-tenancy

### 🎯 Workflow Multi-Tenant

```
1. Login Superadmin (sur base centrale)
   ↓
2. Sélectionner un site dans t_sites
   ↓
3. Frontend envoie X-Tenant-ID header
   ↓
4. Laravel switch vers la DB du site
   ↓
5. Login utilisateur (sur base du site)
   ↓
6. Accès aux données du site uniquement
```

### 🚀 Prochaines Étapes

1. **Lire**: `TUTORIEL_MULTI_TENANCY_LARAVEL.md`
2. **Installer**: Package `stancl/tenancy`
3. **Configurer**: Modèle Tenant + Middleware
4. **Tester**: Login superadmin → sélection site → login tenant

---

## 🎉 Félicitations!

Vous avez maintenant:
- ✅ Une architecture moderne Laravel 11 API + Next.js 15
- ✅ Une structure 100% modulaire (comme votre Symfony)
- ✅ Votre base de données existante intacte
- ✅ **Architecture multi-tenant avec bases séparées** 🆕
- ✅ Séparation admin/superadmin/frontend
- ✅ Optimisations pour millions de données
- ✅ Un système d'authentification sécurisé
- ✅ Des outils pour migrer tous vos autres modules

**Deux tutoriels complets:**
1. 📘 **TUTORIEL_COMPLET_LARAVEL_NEXTJS.md** - Setup de base
2. 🏢 **TUTORIEL_MULTI_TENANCY_LARAVEL.md** - Configuration multi-tenant

**Bon développement! 🚀**