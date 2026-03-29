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

## Code Quality Standards

These rules come from installed skills (clean-code, api-design-principles, architecture-patterns, test-driven-development). Apply them automatically to ALL code — never wait for the user to ask.

### Clean Code (skill: clean-code)
- Intention-revealing names: `getFilteredContracts()` not `getData()`, `$elapsedDays` not `$d`
- Functions do ONE thing, max 20 lines. If name has "and", split it
- Early returns over nested if/else: guard clauses first, happy path last
- No dead code: delete unused imports, variables, methods — don't comment them out
- Don't comment bad code — rewrite it. Comments explain WHY, not WHAT
- Small parameter lists: 0-2 ideal, 3+ needs a DTO/object
- No hidden side effects: function name must describe ALL behavior
- Avoid null returns: use exceptions, early returns, or default values
- DRY: 3+ identical patterns → extract, 2 similar → leave as-is
- No magic strings: use constants (`FIELD_PERMISSIONS`, `PERMISSION_RELATIONS`)

### API Design (skill: api-design-principles)
- Resources are nouns, plural: `/api/admin/contracts`, not `/api/admin/getContract`
- HTTP methods map correctly: GET (read), POST (create), PUT (full replace), PATCH (partial), DELETE
- Status codes: 200 OK, 201 Created, 204 No Content, 400 Bad, 401 Unauth, 403 Forbidden, 404 Not Found, 422 Validation
- Consistent JSON shape: `{ success: bool, data: ..., meta?: ..., message?: ... }`
- Pagination on ALL collections: always include `current_page`, `last_page`, `per_page`, `total`
- Error format: `{ success: false, message: string, error?: string }` — never expose stack traces
- Filter params: snake_case, support both single (`state_id`) and array (`in_state_id[]`)
- Avoid deep URL nesting: max 2 levels (`/contracts/{id}/products`, not deeper)
- Permission-gated fields: compute once in controller, pass to repository + resource

### Architecture Patterns (skill: architecture-patterns)
- Dependencies point inward: domain never imports from controllers/HTTP layer
- Repository pattern: ALL DB queries go through `Repositories/`, never in controllers
- Resource pattern: ALL JSON output goes through `Http/Resources/`, never raw arrays
- Controllers are thin adapters: validate → delegate to repository/service → return resource
- Interfaces before implementations: define contracts (`IContractRepository`) for testability
- Entities have behavior + identity: not just data containers (avoid anemic models)
- Eager-load only what's needed: use `$permittedFields` to skip unnecessary relations
- Constants over config when values are code-coupled (e.g. `FIELD_PERMISSIONS`)
- Module structure: Entities (domain) → Services (logic) → Repositories (data) → Controllers (thin HTTP)

### Test-Driven Development (skill: test-driven-development)
- RED-GREEN-REFACTOR cycle: write failing test → minimal code to pass → refactor
- No production code without a failing test first
- Watch the test fail to prove it tests the right thing
- One behavior per test: split tests with "and" in their names
- Real code in tests, mocks ONLY for external dependencies (DB, API, filesystem)
- Never add test-only methods to production classes
- Run tests with `php artisan test` — module tests in `Modules/{Name}/Tests/`

### Security (always apply)
- Never trust client input for authorization: always check server-side with `$request->user()->hasCredential()`
- Superadmin bypass: check `isSuperadmin()` first in permission logic
- SQL injection: always use Eloquent/query builder, never raw SQL with user input
- No secrets in code: use `.env` for credentials, never hardcode
- Validate at system boundaries only: user input and external APIs

## Related Documentation

For detailed migration documentation, see `TUTORIEL_COMPLET_LARAVEL_NEXTJS_MULTITENANCY.md` in the project root.