# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Laravel 11 API** application with **multi-tenant architecture** using separate databases per tenant. The project uses a **modular architecture** (nwidart/laravel-modules) with three distinct layers: Admin, Superadmin, and Frontend.

## Architecture

### Multi-Tenancy Model

The application uses **database-per-tenant** architecture:
- **Central Database** (`site_dev1`): Stores the `t_sites` table which maps tenant identifiers to their database configurations
- **Tenant Databases**: Each site has its own database with user tables and site-specific data
- Tenant identification: By HTTP header `X-Tenant-ID` or by domain in the `Host` header

### Database Architecture

```
Central DB (site_dev1)
└── t_sites table
    ├── site_id (primary key)
    ├── site_host (domain)
    ├── site_db_name (tenant database name)
    ├── site_db_host (tenant database host)
    ├── site_db_login (tenant database username)
    ├── site_db_password (tenant database password)
    └── site_available (YES/NO)

Tenant DB (separate per site)
└── t_users, t_groups, etc.
```

### Layer Separation

1. **Superadmin Layer** (`/api/superadmin/*`)
   - Uses central database
   - Manages sites/tenants
   - No tenant middleware

2. **Admin Layer** (`/api/admin/*`, `/admin/*`)
   - Uses tenant database (middleware: `['auth:sanctum', 'tenant']`)
   - Site-specific administration

3. **Frontend Layer** (`/api/frontend/*`, `/frontend/*`)
   - Uses tenant database (middleware: `['tenant']`)
   - Public and authenticated tenant routes

### Module Structure

Modules are located in `Modules/` directory. Each module follows this structure:

```
Modules/{ModuleName}/
├── Config/
├── Entities/                    # Models (use tenant database)
├── Http/
│   └── Controllers/
│       ├── Admin/              # Tenant DB operations
│       ├── Superadmin/         # Central DB operations
│       └── Frontend/           # Tenant DB operations
├── Repositories/
├── Routes/
│   ├── admin.php              # Tenant routes
│   ├── superadmin.php         # Central routes
│   └── frontend.php           # Tenant routes
├── Providers/
└── module.json
```

## Development Commands

### Setup
```bash
composer install
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate
php artisan migrate --force
```

### Running the Application
```bash
php artisan serve                    # Start development server
php artisan queue:listen --tries=1   # Queue worker
php artisan pail --timeout=0         # Log viewer
```

### Using Composer Scripts
```bash
composer setup      # Full setup (install + migrate)
composer dev        # Run server, queue, logs, and vite concurrently
composer test       # Run tests
```

### Module Management

Create a new multi-tenant module:
```powershell
.\create-module.ps1 ModuleName
```

This creates a module with Admin/Superadmin/Frontend controllers and routes pre-configured.

Manual module commands:
```bash
php artisan module:make ModuleName
php artisan module:make-controller ControllerName ModuleName --api
php artisan module:make-model ModelName ModuleName
php artisan module:list
php artisan module:enable ModuleName
php artisan module:disable ModuleName
```

### Database Commands

```bash
# Central database migrations
php artisan migrate

# Tenant database migrations (place in database/migrations/tenant/)
php artisan tenants:migrate

# Run migrations for specific tenant
php artisan tenants:run migration --tenant=1
```

### Testing

```bash
# Run all tests
php artisan test
composer test

# Run specific test file
php artisan test tests/Feature/AuthTest.php

# Run with coverage
php artisan test --coverage
```

### Code Quality

```bash
# Laravel Pint (code formatter)
./vendor/bin/pint

# Fix specific files
./vendor/bin/pint path/to/file.php
```

### Useful Artisan Commands

```bash
php artisan route:list                    # List all routes
php artisan config:clear                  # Clear configuration cache
php artisan cache:clear                   # Clear application cache
php artisan queue:work                    # Process queue jobs
php artisan tinker                        # REPL for testing code
php artisan make:migration migration_name # Create migration
composer dump-autoload                    # Regenerate autoloader
```

## Key Implementation Details

### Tenant Middleware

The `InitializeTenancy` middleware (`app/Http/Middleware/InitializeTenancy.php`) handles tenant context switching:
- Reads `X-Tenant-ID` header or domain from request
- Looks up tenant in central database (`t_sites` table)
- Initializes tenant database connection via `tenancy()->initialize($tenant)`
- Automatically ends tenant context after request

### Tenant Model

The `App\Models\Tenant` model (`app/Models/Tenant.php`) extends `Stancl\Tenancy\Database\Models\Tenant`:
- Maps to existing `t_sites` table (not Laravel's default `tenants` table)
- Uses custom primary key `site_id`
- Database connection configuration comes from `t_sites` columns
- No timestamps (uses existing schema)

### Authentication

Uses Laravel Sanctum for API authentication:
- **Superadmin login**: `/api/superadmin/auth/login` (central DB)
- **Tenant login**: `/api/auth/login` (tenant DB, requires `X-Tenant-ID` or domain)
- Token-based authentication with `auth:sanctum` middleware

### Module Routes

Module routes are auto-loaded from `Modules/{ModuleName}/Routes/`:
- `admin.php` - automatically includes `['auth:sanctum', 'tenant']` middleware
- `superadmin.php` - includes `['auth:sanctum']` middleware (no tenant)
- `frontend.php` - includes `['tenant']` middleware (public + auth sections)

## Configuration Notes

### Environment Variables

Critical environment variables in `.env`:
- `DB_DATABASE=site_dev1` - Central database name
- `CACHE_DRIVER=redis` - Required for multi-tenant cache isolation
- `SESSION_DRIVER=redis` - Required for multi-tenant sessions
- `TENANCY_IDENTIFICATION=domain` - Tenant identification method

### Tenancy Configuration

Tenancy settings in `config/tenancy.php`:
- Central connection: `mysql` (defined in `database.connections.mysql`)
- Bootstrappers enable tenant-aware: database, cache, filesystem, queue
- Database names are NOT auto-generated (use values from `t_sites`)

## Common Patterns

### Creating Tenant-Aware Models

Models in modules should be in `Modules/{ModuleName}/Entities/` and use the tenant connection:

```php
namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    // Will automatically use tenant database when tenant is initialized
    protected $table = 't_users';
    protected $connection = 'tenant'; // If needed explicitly
}
```

### Creating Central Database Models

Models for central database (superadmin) should explicitly use the central connection:

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    protected $connection = 'mysql'; // Central database
    protected $table = 't_sites';
}
```

### Working with Existing Tables

This project uses **existing database tables** with legacy schema:
- Tables use `t_` prefix (e.g., `t_users`, `t_sites`)
- Do NOT create new migrations for existing tables
- Do NOT modify existing table structures
- Adapt models to match existing schema (no timestamps, custom primary keys, etc.)

## Important Constraints

1. **Never modify existing database tables** - this is a migration from Symfony 1, all tables must remain compatible
2. **Always specify the correct layer** when creating controllers/routes (Admin/Superadmin/Frontend)
3. **Superadmin routes must NOT use tenant middleware** - they operate on the central database
4. **Always test tenant context** - ensure tenant initialization works before accessing tenant data
5. **Module route files** are automatically loaded - no need to register them manually

## Related Documentation

For detailed migration documentation, see `TUTORIEL_COMPLET_LARAVEL_NEXTJS_MULTITENANCY.md` in the project root.