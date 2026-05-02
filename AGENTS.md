# CLAUDE.md / AGENTS.md (Laravel — Project 2 of 3)

> This file is identical to `AGENTS.md` in this repo. Edit one, copy to the other.
> Read by Claude Code (`CLAUDE.md`) and by Codex / Cursor / Aider / Cline (`AGENTS.md`).

## Project role

This is the **target Laravel 11 backend** of a 3-project migration from Symfony 1. The Next.js frontend calls these APIs. The Symfony source defines the canonical behaviour to reproduce against the same database.

When implementing a new feature here, **always check the Symfony equivalent first** — that's the truth source for business rules, permissions, layout, and edge cases.

---

## Cross-project map (the trio)

| Role | Absolute path | Stack |
|---|---|---|
| **Source (read-only ref)** | `C:\xampp\htdocs\project` | Symfony 1 fork + Smarty 2/3 + jQuery `$.ajax2` |
| **Target backend (this project)** | `C:\laragon\www\backend-api` | Laravel 11 + nwidart/laravel-modules + Sanctum |
| **Target frontend** | `C:\Users\Mounkaila\WebstormProjects\icall26-front` | Next.js 15 + MUI 6 + TypeScript |

The 3 projects share the **same MySQL database per tenant**. Tenant 1 uses `site_db_name = site_theme32` and is reached at `http://tenant1.local`. The frontend dev server (Next.js) is served from the same hostname (rewrites `/api/*` to this Laravel backend).

### Where to look for what (Symfony side, when migrating)

- Action class: `C:\xampp\htdocs\project\modules\<module>\admin\actions\ajax<Action><Entity>Action.class.php`
- Block component: `C:\xampp\htdocs\project\modules\<module>\admin\blocks\<Component>Action.class.php`
- Smarty template (theme override wins): `C:\xampp\htdocs\project\sites\themes\admin\theme32a\designs\default\templates\<module>\<file>.tpl`
- Smarty base template: `C:\xampp\htdocs\project\modules\<module>\admin\designs\templates\<file>.tpl`
- Forms / FormFilters / Pagers: `C:\xampp\htdocs\project\modules\<module>\admin\locales\{Forms,FormFilters,Pagers}\`
- Models (mfObject3 ORM): `C:\xampp\htdocs\project\modules\<module>\common\lib\<Entity>\<Entity>{Base,,Collection}.class.php`
- SQL schema: `C:\xampp\htdocs\project\modules\<module>\superadmin\models\schema.sql`
- Authoritative framework documentation: `C:\xampp\htdocs\project\documentation.md`

### Mapping table (Symfony → Laravel → Next.js)

| Symfony | Laravel | Next.js |
|---|---|---|
| `modules/<m>/admin/actions/ajax<X>Action.class.php` | `Modules/<M>/Http/Controllers/Admin/<X>Controller.php@<method>` | service in `src/modules/<M>/admin/services/*.ts` |
| `modules/<m>/admin/blocks/<X>Action.class.php` | controller method returning JSON | composable React component reading the JSON |
| `modules/<m>/admin/locales/Forms/<X>Form.class.php` | `Modules/<M>/Http/Requests/<X>Request.php` | form validation in component |
| Smarty `.tpl` | (none — controller returns JSON) | `src/modules/<M>/admin/components/<X>.tsx` |
| `modules/<m>/common/lib/<X>/` | `Modules/<M>/Entities/<X>.php` (Eloquent) | `src/modules/<M>/types/index.ts` |
| Smarty `{component name="/<m>/<X>"}` | controller method | composable React component |
| `$.ajax2(...)` | route returning `{ success, data }` | `apiClient.get/post(...)` from `@/shared/lib/api-client` |
| `$user->hasCredential([['x']])` | `$request->user()->hasCredential([['x']])` (helper in `app/Helpers/permissions.php`) | `usePermissions().hasCredential([['x']])` |
| Smarty `{__('key')}` | `__('key')` | `t.<key>` from `useContractTranslations()` |
| `mfMessages::addError($e)` | `response()->json(['success'=>false,'message'=>...], 422)` | snackbar |

### Naming conventions across the trio

| Concept | Symfony | Laravel | Next.js |
|---|---|---|---|
| Module folder | `app_domoprime_iso3` | `AppDomoprimeISO3` | `src/modules/AppDomoprimeISO3/` |
| Entity class | `DomoprimeQuotation` | `DomoprimeQuotation` (same) | `DomoprimeQuotation` interface (same) |
| Tenant table | `t_<module_name>` | same — UNCHANGED | (n/a) |
| Permission | `app_domoprime_iso3_contract_view_ite_documents` | same string in `t_permissions.name` | same string in `hasCredential([['...']])` |
| URL pattern | `/module/<m>/admin/<Action>` | `/api/admin/<m>/<resource>/<action>` | `apiClient` calls hit Laravel URL |

---

## Project Overview (Laravel specifics)

This is a **Laravel 11 API** with **multi-tenant architecture** using separate databases per tenant. Modular architecture (nwidart/laravel-modules) with three distinct layers: **Admin**, **Superadmin**, **Frontend**.

### Multi-Tenancy Model

Database-per-tenant:
- **Central Database** (`site_dev1`): stores `t_sites` table mapping tenants to DBs
- **Tenant Databases**: each site has its own DB with user tables and site-specific data
- Tenant identification: `X-Tenant-Id` header OR domain in `Host` header

```
Central DB (site_dev1)
└── t_sites
    ├── site_id (PK)
    ├── site_host (domain)
    ├── site_db_name (tenant DB name)
    ├── site_db_host
    ├── site_db_login
    ├── site_db_password
    └── site_available (YES/NO)

Tenant DB (per site, e.g. site_theme32 for tenant_id=1)
└── t_users, t_groups, t_permissions, t_customers_contract, t_partner_polluter_company, t_site_company_model, ...
```

### Layer separation

1. **Superadmin** (`/api/superadmin/*`) — central DB, no tenant middleware
2. **Admin** (`/api/admin/*`) — tenant DB, middleware `['auth:sanctum', 'tenant']`
3. **Frontend** (`/api/frontend/*`) — tenant DB, middleware `['tenant']`

### Module structure

```
Modules/{ModuleName}/
├── Config/
├── Entities/                    # Models (use tenant connection)
├── Http/
│   ├── Controllers/{Admin,Superadmin,Frontend}/
│   ├── Requests/                # Form requests
│   └── Resources/               # API resources
├── Repositories/
├── Routes/
│   ├── admin.php               # Tenant routes (auto loaded with auth+tenant middleware)
│   ├── superadmin.php          # Central routes
│   └── frontend.php            # Tenant routes (public + auth)
├── Providers/
└── module.json
```

---

## Development Commands

### Setup
```bash
composer install
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate
php artisan migrate --force
```

### Run
```bash
php artisan serve
php artisan queue:listen --tries=1
php artisan pail --timeout=0
composer dev      # serve + queue + logs + vite concurrently
composer test
```

### Module management
```bash
.\create-module.ps1 ModuleName    # PowerShell helper that scaffolds Admin/Superadmin/Frontend layers
php artisan module:make ModuleName
php artisan module:make-controller ControllerName ModuleName --api
php artisan module:make-model ModelName ModuleName
php artisan module:list
php artisan module:enable ModuleName
php artisan module:disable ModuleName  # ⚠ new modules are created Disabled — remember to enable
```

### Database
```bash
php artisan migrate                                  # central
php artisan tenants:migrate                          # all tenant DBs
php artisan tenants:run migration --tenant=1         # single tenant
```

### Useful
```bash
php artisan route:list           # often needed after adding routes
php artisan route:clear
php artisan config:clear
php artisan cache:clear
./vendor/bin/pint                # code formatter
```

---

## Authentication

Uses **Laravel Sanctum** with Bearer tokens:
- **Superadmin login**: `POST /api/superadmin/auth/login` (central DB)
- **Tenant login**: `POST /api/auth/login` (tenant DB, requires `X-Tenant-Id` or domain)
- Token-based with `auth:sanctum` middleware

---

## Permissions / `hasCredential`

Helper in `app/Helpers/permissions.php` reproduces the Symfony 1 `hasCredential` API:
```php
$user->hasCredential([['superadmin', 'app_domoprime_iso3_contract_view_ite_documents']])  // OR
$user->hasCredential(['perm1', 'perm2'], requireAll: true)                                  // AND
```
- Caching: `$cachedPermissionIndex` (O(1) lookup via array_flip)
- Superadmin bypass: `isSuperadmin()` short-circuits everything
- 'admin' / 'superadmin' are checked via `t_user_group` (role table), not `t_permissions`

Credentials are **imported as-is** from Symfony into `t_permissions.name` (no renaming). When a Symfony component used `hasCredential([['app_domoprime_iso3_contract_view_ite_documents']])`, the Laravel controller / Next.js component must use the **exact same string**.

---

## Common patterns

### Tenant-aware models
```php
namespace Modules\UsersGuard\Entities;

class User extends \Illuminate\Database\Eloquent\Model
{
    protected $table = 't_users';
    protected $connection = 'tenant'; // explicit if needed
}
```

### Central DB models
```php
namespace App\Models;

class Tenant extends \Stancl\Tenancy\Database\Models\Tenant
{
    protected $connection = 'mysql';   // central
    protected $table = 't_sites';
    protected $primaryKey = 'site_id';
    public $timestamps = false;
}
```

### Standard JSON response shape
```php
return response()->json([
    'success' => true,
    'data'    => [/* ... */],
    'message' => 'optional',
]);
```

### File resolution (legacy Symfony files vs new S3/MinIO storage)

The Symfony source stores files at `sites/{site_db_name}/(frontend|admin)/data/<module>/...`. The cloud target uses the **same hierarchy** under S3/MinIO via `TenantStorageManager`. Standard 3-step resolution (see `Modules\CustomersDocuments\Http\Controllers\Admin\DocumentController::download` and `Modules\AppDomoprimeISO3\Http\Controllers\Admin\Iso3DocumentController::exportCompanyModelPdf`):

```php
// 1) Cloud (S3/MinIO) via TenantStorageManager
$tenant = \App\Models\Tenant::first();
$storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
$relativePath = "frontend/data/<module>/<entity_id>/{$file}";
$fullPath = $storageManager->getTenantPath($tenant->site_id) . "/{$relativePath}";
$disk = $storageManager->getCurrentDisk();
if (Storage::disk($disk)->exists($fullPath)) {
    return response()->streamDownload(/* … */);
}

// 2) Local Laravel storage + 3) legacy Symfony path
$siteName = \DB::connection('tenant')->getDatabaseName();
$candidates = [
    storage_path("app/private/sites/{$siteName}/{$relativePath}"),
    base_path("sites/{$siteName}/{$relativePath}"),
    rtrim(config('migration.legacy_path'), '/\\') . "/sites/{$siteName}/{$relativePath}",
];
foreach ($candidates as $path) {
    if (is_file($path)) return response()->file($path, $headers);
}
```

`config/migration.php` controls `legacy_path` (default `C:/xampp/htdocs/project`) and `site_mapping` for non-default tenant→site mappings.

---

## Key implementation details

### Tenant middleware (`app/Http/Middleware/InitializeTenancy.php`)
- Reads `X-Tenant-Id` header or domain
- Looks up in central `t_sites`
- Calls `tenancy()->initialize($tenant)` and ends context after request

### Tenant model (`App\Models\Tenant`)
- Extends `Stancl\Tenancy\Database\Models\Tenant`
- Maps to `t_sites` (NOT default `tenants`)
- Custom PK `site_id`
- DB connection config from `t_sites` columns
- No timestamps

### Module routes auto-load
Module routes loaded from `Modules/{Name}/Routes/`:
- `admin.php` → `['auth:sanctum', 'tenant']`
- `superadmin.php` → `['auth:sanctum']`
- `frontend.php` → `['tenant']`

---

## Configuration

### Critical env vars
- `DB_DATABASE=site_dev1` — central DB name
- `CACHE_DRIVER=redis` — required for multi-tenant cache isolation
- `SESSION_DRIVER=redis`
- `TENANCY_IDENTIFICATION=domain`
- `LEGACY_PROJECT_PATH=C:/xampp/htdocs/project` (used by `config/migration.php`)

### Tenancy config (`config/tenancy.php`)
- Central connection: `mysql`
- Bootstrappers: database, cache, filesystem, queue
- Database names NOT auto-generated (use values from `t_sites`)

---

## Migration learnings (consolidated from prior sessions)

### Schema verification
Symfony `schema.sql` files MAY NOT match the live tenant DB (columns added/removed over time). **Always verify with `SHOW COLUMNS FROM t_<table>`** before assuming a column exists.

### Date pitfalls
- `'0000-00-00 00:00:00'` causes errors in Laravel strict mode → handle in copy/replicate methods
- NULL FKs: never use `0`, use `null` or a valid ID
- NOT NULL columns without defaults: always provide values (e.g., `address2`, `details`, `union_id`)

### Bash/PowerShell pitfalls (Windows)
- Use Unix paths in bash (`/c/laragon/...`) not Windows paths
- `php artisan tinker --execute` chokes on `$c` (bash glob expansion) — write a temp PHP file instead

### New modules
Created **disabled** by default → `php artisan module:enable <Name>` after creation.

### Cross-module entities
Some entities live in unexpected modules:
- `Callcenter` → `Modules\User\Entities\Callcenter` (table: `t_callcenter`)
- `CustomerContractCompany` → `Modules\CustomersContracts\Entities\CustomerContractCompany` (table: `t_customers_contracts_company`)

### Authentication seeding
Tokens for tenant DB cannot be created via `tinker` (no tenant context). Use a temp PHP script with `tenancy()->initialize($tenant)`.

### Hold gates (CRITICAL)
Symfony hides the documents fieldset entirely when `is_hold='YES'` OR (`is_hold_quote='YES'` AND user has `contract_view_hold_quote`). The Next.js orchestrator (`EditSubTabDocuments.tsx`) reproduces this — controllers must NOT enforce this themselves; the gate is a UI concern.

### Polluter type document split
`contract.tpl:963-973` (Symfony) renders 6 distinct document blocks per polluter type, each with its own credential gate (`app_domoprime_iso3_contract_view_<type>_documents`). Next.js mirrors this via `BasePolluterDocumentsSection` + 5 thin wrappers (ITE, BOILER, PAC, TYPE1, TYPE2) + 1 legacy fallback.

### Signature stacks (NOT yet migrated)
Symfony has 3 independent stacks: `app_domoprime_yousign`, `app_domoprime_yousign_evidence`, `app_domoprime_docusign`. None has Laravel equivalents yet.

---

## Important constraints

1. **Never modify existing tenant tables** — schemas remain compatible with Symfony for shared-DB operation
2. **Always specify the correct layer** when creating controllers/routes (Admin/Superadmin/Frontend)
3. **Superadmin routes must NOT use tenant middleware** — they operate on the central database
4. **Module route files** are auto-loaded — don't register manually
5. **Always test tenant context** before accessing tenant data

---

## Code Quality Standards

These rules come from installed skills (clean-code, api-design-principles, architecture-patterns, test-driven-development). Apply automatically — never wait for the user to ask.

### Clean Code
- Intention-revealing names: `getFilteredContracts()` not `getData()`
- Functions do ONE thing, max ~20 lines. If name has "and", split it
- Early returns / guard clauses, happy path last
- No dead code: delete unused imports, variables, methods
- Don't comment bad code — rewrite it. Comments explain WHY, not WHAT
- Small parameter lists: 0-2 ideal, 3+ needs a DTO/object
- DRY: 3+ identical patterns → extract; 2 similar → leave as-is
- No magic strings: use constants

### API Design
- Resources are nouns plural: `/api/admin/contracts`
- HTTP methods: GET (read), POST (create), PUT (replace), PATCH (partial), DELETE
- Status: 200, 201, 204, 400, 401, 403, 404, 422
- JSON shape: `{ success: bool, data: ..., meta?, message? }`
- Pagination: always include `current_page`, `last_page`, `per_page`, `total`
- Error format: `{ success: false, message: string, error?: string }` — no stack traces
- Filter params: snake_case, support both single and array forms
- Max 2 levels of URL nesting
- Permission-gated fields: compute once in controller, pass to repository + resource

### Architecture
- Dependencies point inward: domain never imports HTTP layer
- Repositories: ALL DB queries through `Repositories/`, never in controllers
- Resources: ALL JSON through `Http/Resources/`, never raw arrays
- Controllers are thin adapters: validate → delegate → return resource
- Interfaces before implementations for testability
- Eager-load only what's needed (`$permittedFields`)
- Constants over config when values are code-coupled

### Test-Driven Development
- RED-GREEN-REFACTOR
- No production code without a failing test first
- One behavior per test
- Real code in tests, mocks ONLY for external deps (DB, API, filesystem)
- Run with `php artisan test` — module tests in `Modules/{Name}/Tests/`

### Security (always)
- Never trust client input for authorization — server-side `hasCredential` checks
- Superadmin bypass first
- SQL injection: always Eloquent/query builder, never raw SQL with user input
- No secrets in code: `.env` only
- Validate at system boundaries only

---

## Related documentation

- Authoritative migration tutorial: `TUTORIEL_COMPLET_LARAVEL_NEXTJS_MULTITENANCY.md` (project root)
- Symfony framework reference: `C:\xampp\htdocs\project\documentation.md`
- Migration config: `config/migration.php`
- File resolution example: `Modules\CustomersDocuments\Http\Controllers\Admin\DocumentController` & `Modules\AppDomoprimeISO3\Http\Controllers\Admin\Iso3DocumentController`
