# Section Multi-Tenancy - À Ajouter au Tutoriel Principal

## Architecture Multi-Tenant avec Bases de Données Séparées

---

## 🏗️ Architecture Actuelle de Votre Système

Votre système utilise une architecture **multi-tenant avec séparation par base de données** :

### Structure de Votre Base Superadmin

```sql
-- Table t_sites (dans la base superadmin)
CREATE TABLE `t_sites` (
  `site_id` int(11) NOT NULL AUTO_INCREMENT,
  `site_host` varchar(255) NOT NULL,              -- exemple.com
  `site_db_name` varchar(64) NOT NULL,             -- db_site_exemple
  `site_db_login` varchar(40) NOT NULL,            -- root
  `site_db_password` varchar(40) NOT NULL,         -- password
  `site_db_host` varchar(128) NOT NULL,            -- localhost
  `site_admin_theme` varchar(64) NOT NULL,
  `site_frontend_theme` varchar(64) NOT NULL,
  `site_available` enum('YES','NO') NOT NULL,
  PRIMARY KEY (`site_id`),
  UNIQUE KEY `site_host` (`site_host`)
);
```

### Schéma de l'Architecture

```
┌─────────────────────────────────────────────────┐
│         Base Superadmin (Centrale)              │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │ t_sites                             │       │
│  ├─────────────────────────────────────┤       │
│  │ site1.com → db_site1 (localhost)    │ ──────┼──→ DB: db_site1
│  │ site2.com → db_site2 (localhost)    │ ──────┼──→ DB: db_site2
│  │ site3.com → db_site3 (server2)      │ ──────┼──→ DB: db_site3 (autre serveur)
│  └─────────────────────────────────────┘       │
│                                                 │
│  t_users (superadmin users)                    │
│  t_groups, t_permissions, etc.                 │
└─────────────────────────────────────────────────┘

     ↓                    ↓                    ↓

┌──────────┐      ┌──────────┐        ┌──────────┐
│ db_site1 │      │ db_site2 │        │ db_site3 │
│          │      │          │        │          │
│ t_users  │      │ t_users  │        │ t_users  │
│ t_groups │      │ t_groups │        │ t_groups │
│ t_...    │      │ t_...    │        │ t_...    │
└──────────┘      └──────────┘        └──────────┘
```

---

## 🚀 Solution Laravel : Tenancy Multi-Database

### Option Recommandée : `stancl/tenancy`

Le package **[stancl/tenancy](https://tenancyforlaravel.com/)** est le meilleur pour votre cas car il supporte :
- ✅ Multi-database tenancy (une DB par site)
- ✅ Identification par domaine/host
- ✅ Migration automatique par tenant
- ✅ Cache isolé par tenant
- ✅ Storage séparé par tenant

---

## 📦 Installation et Configuration

### Étape 1 : Installer Tenancy

```bash
cd C:\xampp\htdocs\backend-api

# Installer le package
composer require stancl/tenancy

# Publier la configuration
php artisan vendor:publish --provider='Stancl\Tenancy\TenancyServiceProvider'
```

### Étape 2 : Configuration Tenancy

Éditez `backend-api/config/tenancy.php`:

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tenant Model
    |--------------------------------------------------------------------------
    */
    'tenant_model' => \App\Models\Tenant::class,

    /*
    |--------------------------------------------------------------------------
    | Database Configuration
    |--------------------------------------------------------------------------
    */
    'database' => [
        'central_connection' => env('DB_CONNECTION', 'mysql'),

        'template_tenant_connection' => null,

        // Préfixe pour les connexions tenant (optionnel)
        'prefix' => 'tenant',

        // Suffixe pour les bases de données tenant
        'suffix' => '',

        'managers' => [
            'database' => [
                'connection' => env('TENANCY_DATABASE_CONNECTION', 'mysql'),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant Identification
    |--------------------------------------------------------------------------
    */
    'identification' => [
        // Identifier par domaine (site_host)
        'domain' => [
            'enabled' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Features
    |--------------------------------------------------------------------------
    */
    'features' => [
        // Stancl\Tenancy\Features\UserImpersonation::class,
        // Stancl\Tenancy\Features\TelescopeTags::class,
        // Stancl\Tenancy\Features\TenantConfig::class,
        Stancl\Tenancy\Features\TenantRedis::class,
    ],
];
```

### Étape 3 : Créer le Modèle Tenant

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
     * Pas de timestamps Laravel (utiliser vos propres champs si disponibles)
     */
    public $timestamps = false;

    /**
     * Colonnes custom pour la connexion DB
     */
    public function getDatabaseName(): string
    {
        return $this->site_db_name;
    }

    public function getDatabaseUsername(): string
    {
        return $this->site_db_login;
    }

    public function getDatabasePassword(): string
    {
        return $this->site_db_password;
    }

    public function getDatabaseHost(): string
    {
        return $this->site_db_host;
    }

    /**
     * Obtenir le domaine du tenant
     */
    public function getDomain(): string
    {
        return $this->site_host;
    }

    /**
     * Vérifier si le site est disponible
     */
    public function isAvailable(): bool
    {
        return $this->site_available === 'YES';
    }

    /**
     * Boot method pour customiser le comportement
     */
    public static function booted()
    {
        static::creating(function ($tenant) {
            // Vous pouvez ajouter de la logique ici
        });
    }
}
```

### Étape 4 : Créer le TenancyServiceProvider Custom

Créez `backend-api/app/Providers/TenancyServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Contracts\Tenant;
use Stancl\Tenancy\Database\DatabaseManager;

class TenancyServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // Écouter l'événement de switch de tenant
        \Stancl\Tenancy\Events\TenancyInitialized::class => function ($event) {
            $tenant = $event->tenancy->tenant;

            // Configuration dynamique de la connexion DB
            config([
                'database.connections.tenant' => [
                    'driver' => 'mysql',
                    'host' => $tenant->getDatabaseHost(),
                    'port' => 3306,
                    'database' => $tenant->getDatabaseName(),
                    'username' => $tenant->getDatabaseUsername(),
                    'password' => $tenant->getDatabasePassword(),
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'strict' => true,
                    'engine' => null,
                ],
            ]);

            // Purger et reconnecter
            DB::purge('tenant');
            DB::reconnect('tenant');

            // Définir comme connexion par défaut
            DB::setDefaultConnection('tenant');
        };

        // Revenir à la connexion centrale après
        \Stancl\Tenancy\Events\TenancyEnded::class => function () {
            DB::setDefaultConnection('mysql');
        };
    }
}
```

**Enregistrer le provider dans `config/app.php`:**

```php
'providers' => [
    // ...
    App\Providers\TenancyServiceProvider::class,
],
```

### Étape 5 : Configuration .env

Éditez `backend-api/.env`:

```env
# Connexion CENTRALE (base superadmin)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=base_superadmin        # ⚠️ Base avec t_sites
DB_USERNAME=root
DB_PASSWORD=

# Configuration Tenancy
TENANCY_DATABASE_CONNECTION=mysql
TENANCY_IDENTIFICATION=domain      # Identification par domaine
```

### Étape 6 : Middleware Tenancy

Créez le middleware `backend-api/app/Http/Middleware/InitializeTenancy.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Stancl\Tenancy\Tenancy;

class InitializeTenancy
{
    protected $tenancy;

    public function __construct(Tenancy $tenancy)
    {
        $this->tenancy = $tenancy;
    }

    public function handle(Request $request, Closure $next)
    {
        // Option 1: Identifier par domaine (Host header)
        $domain = $request->getHost();

        // Option 2: Identifier par header custom X-Tenant-ID
        if ($request->hasHeader('X-Tenant-ID')) {
            $siteId = $request->header('X-Tenant-ID');
            $tenant = Tenant::where('site_id', $siteId)->first();
        } else {
            // Chercher le tenant par domaine
            $tenant = Tenant::where('site_host', $domain)
                ->where('site_available', 'YES')
                ->first();
        }

        if (!$tenant) {
            return response()->json([
                'error' => 'Tenant not found',
                'domain' => $domain,
            ], 404);
        }

        // Initialiser le contexte tenant
        $this->tenancy->initialize($tenant);

        $response = $next($request);

        // Terminer le contexte tenant
        $this->tenancy->end();

        return $response;
    }
}
```

**Enregistrer dans `app/Http/Kernel.php`:**

```php
protected $middlewareAliases = [
    // ...
    'tenant' => \App\Http\Middleware\InitializeTenancy::class,
];
```

---

## 🛣️ Routes Multi-Tenant

### Configuration des Routes

Éditez `backend-api/routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| Routes CENTRALES (Superadmin)
|--------------------------------------------------------------------------
| Ces routes utilisent la base superadmin
*/

Route::prefix('superadmin')->group(function () {
    // Login superadmin (sur base centrale)
    Route::post('/auth/login', [AuthController::class, 'loginSuperadmin']);

    Route::middleware('auth:sanctum')->group(function () {
        // Gestion des sites/tenants
        Route::get('/sites', [SiteController::class, 'index']);
        Route::post('/sites', [SiteController::class, 'store']);
        Route::get('/sites/{id}', [SiteController::class, 'show']);
        Route::put('/sites/{id}', [SiteController::class, 'update']);
        Route::delete('/sites/{id}', [SiteController::class, 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Routes TENANT (Par Site)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données du site identifié
*/

Route::middleware(['tenant'])->group(function () {
    // Auth tenant
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'loginTenant']);
    });

    // Routes protégées tenant
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Modules du site
        Route::prefix('admin')->group(function () {
            // Les modules chargeront leurs routes ici
            // Exemple: Modules/UsersGuard/Routes/admin.php
        });
    });
});
```

---

## 🎮 Contrôleurs Multi-Tenant

### Contrôleur de Gestion des Sites (Superadmin)

Créez `backend-api/app/Http/Controllers/Api/SiteController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteController extends Controller
{
    /**
     * Lister tous les sites
     * GET /api/superadmin/sites
     */
    public function index(Request $request)
    {
        $sites = Tenant::select([
                'site_id',
                'site_host',
                'site_db_name',
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
            ->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $sites->items(),
            'meta' => [
                'current_page' => $sites->currentPage(),
                'total' => $sites->total(),
                'per_page' => $sites->perPage(),
            ],
        ]);
    }

    /**
     * Afficher un site
     * GET /api/superadmin/sites/{id}
     */
    public function show($id)
    {
        $site = Tenant::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'site_id' => $site->site_id,
                'site_host' => $site->site_host,
                'site_db_name' => $site->site_db_name,
                'site_db_host' => $site->site_db_host,
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
    public function store(Request $request)
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
                'site_admin_theme' => $validated['site_admin_theme'] ?? 'theme1',
                'site_frontend_theme' => $validated['site_frontend_theme'] ?? 'theme1',
                'site_available' => 'YES',
            ]);

            // 3. Migrer les tables du tenant
            $this->migrateTenantDatabase($site);

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
     * Créer la base de données du tenant
     */
    protected function createTenantDatabase(array $data)
    {
        $dbName = $data['site_db_name'];

        // Créer la base de données
        DB::statement("CREATE DATABASE IF NOT EXISTS `{$dbName}`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Créer l'utilisateur (si différent de root)
        if ($data['site_db_login'] !== 'root') {
            $user = $data['site_db_login'];
            $password = $data['site_db_password'];
            $host = $data['site_db_host'];

            DB::statement("CREATE USER IF NOT EXISTS '{$user}'@'{$host}'
                IDENTIFIED BY '{$password}'");

            DB::statement("GRANT ALL PRIVILEGES ON `{$dbName}`.*
                TO '{$user}'@'{$host}'");

            DB::statement("FLUSH PRIVILEGES");
        }
    }

    /**
     * Migrer les tables du tenant
     */
    protected function migrateTenantDatabase(Tenant $tenant)
    {
        // Configurer la connexion temporaire
        config([
            'database.connections.temp_tenant' => [
                'driver' => 'mysql',
                'host' => $tenant->site_db_host,
                'database' => $tenant->site_db_name,
                'username' => $tenant->site_db_login,
                'password' => $tenant->site_db_password,
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
            ],
        ]);

        // Exécuter les migrations tenant
        // (Créer les tables t_users, t_groups, etc. dans la base du site)
        \Artisan::call('tenants:migrate', [
            '--tenants' => [$tenant->site_id],
        ]);
    }

    /**
     * Tester la connexion à un site
     * POST /api/superadmin/sites/{id}/test-connection
     */
    public function testConnection($id)
    {
        $site = Tenant::findOrFail($id);

        try {
            // Tester la connexion
            $pdo = new \PDO(
                "mysql:host={$site->site_db_host};dbname={$site->site_db_name}",
                $site->site_db_login,
                $site->site_db_password
            );

            // Compter les tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            return response()->json([
                'success' => true,
                'message' => 'Connection successful',
                'data' => [
                    'database' => $site->site_db_name,
                    'tables_count' => count($tables),
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
}
```

### Authentification Multi-Tenant

Modifiez `backend-api/app/Http/Controllers/Api/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login SUPERADMIN (sur base centrale)
     * POST /api/superadmin/auth/login
     */
    public function loginSuperadmin(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Chercher dans la base CENTRALE (superadmin)
        $user = DB::connection('mysql')
            ->table('t_users')
            ->where('username', $validated['username'])
            ->where('application', 'superadmin')
            ->where('is_active', 1)
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials'],
            ]);
        }

        // Créer un User model temporaire pour Sanctum
        $userModel = User::find($user->id);
        $token = $userModel->createToken('superadmin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Superadmin login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Login TENANT (sur base du site)
     * POST /api/auth/login
     * Header: X-Tenant-ID ou domaine
     */
    public function loginTenant(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'application' => 'required|in:admin,frontend',
        ]);

        // À ce stade, le middleware 'tenant' a déjà changé la connexion DB
        // Donc on cherche dans la base du TENANT actuel

        $user = User::where('username', $validated['username'])
            ->where('application', $validated['application'])
            ->where('is_active', 1)
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials'],
            ]);
        }

        // Créer le token
        $token = $user->createToken('tenant-token')->plainTextToken;

        // Charger les relations
        $user->load(['groups.permissions', 'permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
                'tenant' => [
                    'id' => tenancy()->tenant->site_id,
                    'host' => tenancy()->tenant->site_host,
                ],
            ],
        ]);
    }

    /**
     * Get current user
     * GET /api/auth/me
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['groups.permissions', 'permissions']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }
}
```

---

## 🧪 Tester le Multi-Tenancy

### Script PowerShell de Test

Créez `backend-api/test-multi-tenancy.ps1`:

```powershell
# Test Multi-Tenancy

$baseUrl = "http://localhost:8000/api"

Write-Host "🏢 Testing Multi-Tenancy..." -ForegroundColor Cyan
Write-Host ""

# 1. Login Superadmin
Write-Host "1️⃣ Superadmin Login..." -ForegroundColor Yellow
$loginBody = @{
    username = "superadmin"
    password = "password"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/superadmin/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$data = $response.Content | ConvertFrom-Json
$superadminToken = $data.data.token

Write-Host "✅ Superadmin logged in" -ForegroundColor Green
Write-Host ""

# 2. Lister les sites
Write-Host "2️⃣ List all sites..." -ForegroundColor Yellow
$sitesResponse = Invoke-WebRequest -Uri "$baseUrl/superadmin/sites" `
    -Headers @{Authorization = "Bearer $superadminToken"}

$sites = ($sitesResponse.Content | ConvertFrom-Json).data
Write-Host "Found $($sites.Count) sites" -ForegroundColor Gray

foreach ($site in $sites) {
    Write-Host "  - $($site.site_host) → $($site.site_db_name)" -ForegroundColor Gray
}
Write-Host ""

# 3. Login sur un tenant spécifique
if ($sites.Count -gt 0) {
    $firstSite = $sites[0]

    Write-Host "3️⃣ Tenant Login (Site: $($firstSite.site_host))..." -ForegroundColor Yellow

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

    Write-Host "✅ Tenant login successful" -ForegroundColor Green
    Write-Host "Tenant: $($tenantData.data.tenant.host)" -ForegroundColor Gray
    Write-Host ""

    # 4. Récupérer les données du tenant
    Write-Host "4️⃣ Get tenant user data..." -ForegroundColor Yellow
    $meResponse = Invoke-WebRequest -Uri "$baseUrl/auth/me" `
        -Headers @{
            "Authorization" = "Bearer $($tenantData.data.token)"
            "X-Tenant-ID" = $firstSite.site_id
        }

    $meResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
    Write-Host "✅ Tenant user retrieved" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Multi-Tenancy tests completed!" -ForegroundColor Green
```

---

## 📱 Frontend Next.js Multi-Tenant

### Configuration Tenant dans Next.js

Créez `frontend-nextjs/src/lib/tenant-context.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Tenant {
  id: number;
  host: string;
  name: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant) => void;
  tenantId: number | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  setTenant: () => {},
  tenantId: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    // Récupérer le tenant depuis localStorage
    const storedTenant = localStorage.getItem('tenant');
    if (storedTenant) {
      setTenant(JSON.parse(storedTenant));
    }
  }, []);

  const handleSetTenant = (newTenant: Tenant) => {
    setTenant(newTenant);
    localStorage.setItem('tenant', JSON.stringify(newTenant));
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        setTenant: handleSetTenant,
        tenantId: tenant?.id || null,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
```

### Modifier le client API pour inclure le Tenant ID

Mettez à jour `frontend-nextjs/src/lib/api/client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

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

        // Ajouter le Tenant ID
        const tenant = this.getTenant();
        if (tenant && config.headers) {
          config.headers['X-Tenant-ID'] = tenant.id;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private getTenant(): { id: number } | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tenant');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }

  // ... rest of the code
}
```

### Page de Sélection de Site

Créez `frontend-nextjs/src/app/select-site/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useTenant } from '@/lib/tenant-context';

interface Site {
  site_id: number;
  site_host: string;
  site_db_name: string;
}

export default function SelectSitePage() {
  const router = useRouter();
  const { setTenant } = useTenant();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      // Login superadmin pour récupérer la liste
      const token = localStorage.getItem('superadmin_token');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/sites`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSites(response.data.data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSite = (site: Site) => {
    setTenant({
      id: site.site_id,
      host: site.site_host,
      name: site.site_host,
    });

    router.push('/login');
  };

  if (loading) {
    return <div>Loading sites...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Select a Site</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <button
              key={site.site_id}
              onClick={() => selectSite(site)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{site.site_host}</h3>
              <p className="text-sm text-gray-600">{site.site_db_name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 Checklist Multi-Tenancy

- [ ] Installer `stancl/tenancy`
- [ ] Créer le modèle Tenant (utilise t_sites)
- [ ] Configurer TenancyServiceProvider
- [ ] Créer le middleware InitializeTenancy
- [ ] Créer SiteController (gestion sites)
- [ ] Séparer les routes central/tenant
- [ ] Modifier AuthController (login superadmin + tenant)
- [ ] Tester connexion multi-tenant
- [ ] Configurer frontend avec sélection de site
- [ ] Migrer les modules vers architecture tenant

---

## 🎯 Résumé

Votre architecture multi-tenant avec Laravel:

1. **Base Superadmin** (centrale)
   - Table `t_sites` liste tous les sites
   - Gestion des sites via API superadmin
   - Authentification superadmin séparée

2. **Bases Tenant** (une par site)
   - Chaque site a sa propre base de données
   - Connexion dynamique via middleware
   - Isolation complète des données

3. **Identification**
   - Par domaine (Host header)
   - Par header custom (X-Tenant-ID)
   - Sélection manuelle dans frontend

4. **Frontend Next.js**
   - Sélection du site avant login
   - Header X-Tenant-ID dans toutes les requêtes
   - Context React pour gérer le tenant actuel

Cette architecture préserve votre système actuel tout en le modernisant! 🚀