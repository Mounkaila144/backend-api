# 9. Base de Donnees : Schema Legacy, Connexions et Migrations

## La contrainte numero 1

> **Les tables existantes de Symfony 1 ne doivent PAS etre modifiees.**

Le schema a ete concu pour Symfony 1. Des milliers de lignes de donnees existent deja.
D'autres parties du systeme (peut-etre meme l'ancien Symfony) y accedent encore.
On adapte le code Laravel au schema, jamais l'inverse.

---

## Les deux types de connexions

### 1. Connexion `mysql` (centrale)

```php
// config/database.php
'mysql' => [
    'driver'   => 'mysql',
    'host'     => env('DB_HOST', '127.0.0.1'),
    'database' => env('DB_DATABASE', 'site_dev1'),  // Base centrale
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
],
```

**Utilisee par** :
- `app/Models/Tenant.php` (table `t_sites`)
- `app/Models/User.php` (superadmin `t_users`)
- Tout ce qui est superadmin

### 2. Connexion `tenant` (dynamique)

```php
// Configuree dynamiquement par TenancyServiceProvider
// PAS definie dans config/database.php
// Creee a chaque requete via InitializeTenancy middleware

'tenant' => [
    'driver'   => 'mysql',
    'host'     => $tenant->site_db_host,      // Vient de t_sites
    'database' => $tenant->site_db_name,      // Vient de t_sites
    'username' => $tenant->site_db_login,     // Vient de t_sites
    'password' => $tenant->site_db_password,  // Vient de t_sites
],
```

**Utilisee par** :
- Tous les modeles dans `Modules/*/Entities/`
- Tout ce qui est admin et frontend

---

## Schema des tables principales

### Base Centrale (`site_dev1`)

```sql
-- Table maitre des tenants
CREATE TABLE t_sites (
    site_id          INT AUTO_INCREMENT PRIMARY KEY,
    site_host        VARCHAR(255),        -- "client1.monapp.com"
    site_name        VARCHAR(255),
    site_db_name     VARCHAR(255),        -- "db_client1"
    site_db_host     VARCHAR(255),        -- "127.0.0.1"
    site_db_login    VARCHAR(255),        -- "user_client1"
    site_db_password VARCHAR(255),        -- mot de passe chiffre
    site_db_port     INT DEFAULT 3306,
    site_available   ENUM('YES','NO'),    -- Le tenant est-il actif ?
    site_db_ssl_enabled TINYINT DEFAULT 0,
    site_db_ssl_mode    VARCHAR(50),
    site_db_ssl_ca      TEXT
);
```

### Base Tenant (une par client)

```sql
-- Utilisateurs du tenant
CREATE TABLE t_users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(16),
    email           VARCHAR(255),
    password        VARCHAR(255),         -- MD5 (32 chars) ou bcrypt (60 chars)
    firstname       VARCHAR(64),
    lastname        VARCHAR(64),
    is_active       ENUM('YES','NO'),
    lastlogin       DATETIME,
    -- PAS de created_at ni updated_at
);

-- Groupes (roles)
CREATE TABLE t_groups (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255),         -- "1-ADMINISTRATEUR THEME GES"
    application     ENUM('admin','frontend','superadmin'),
    description     TEXT
);

-- Permissions
CREATE TABLE t_permissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255),         -- "contract_view", "admin", "superadmin"
    description     TEXT,
    group_id        INT DEFAULT 0         -- 0 = standalone
);

-- Pivot : user ↔ group
CREATE TABLE t_user_group (
    user_id         INT,
    group_id        INT,
    PRIMARY KEY (user_id, group_id)
);

-- Pivot : group ↔ permission
CREATE TABLE t_group_permission (
    group_id        INT,
    permission_id   INT,
    PRIMARY KEY (group_id, permission_id)
);

-- Pivot : user ↔ permission (permissions directes)
CREATE TABLE t_user_permission (
    user_id         INT,
    permission_id   INT,
    PRIMARY KEY (user_id, permission_id)
);

-- Clients
CREATE TABLE t_customers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    firstname       VARCHAR(255),
    lastname        VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    address         TEXT,
    city            VARCHAR(255),
    zipcode         VARCHAR(10),
    -- ... beaucoup d'autres champs
);

-- Contrats (la table la plus complexe)
CREATE TABLE t_customers_contracts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT,                  -- FK vers t_customers
    partner_id      INT,                  -- FK vers t_partners_company
    user_id         INT,                  -- FK vers t_users (commercial)
    reference       VARCHAR(255),
    state_id        INT,                  -- FK vers table de statuts
    opc_state_id    INT,                  -- FK vers table de statuts OPC
    isLast          ENUM('YES','NO'),
    is_quotations_valid ENUM('YES','NO'),
    created_at      DATETIME,
    -- ... 20+ colonnes de relations et flags
);

-- Partenaires
CREATE TABLE t_partners_company (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255),
    siret           VARCHAR(14),
    -- ...
);

-- Produits
CREATE TABLE t_products_taxes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255),
    price           DECIMAL(10,2),
    tax_rate        DECIMAL(5,2),
    -- ...
);
```

---

## Comment adapter un modele Eloquent au schema legacy

### Les differences avec un modele Laravel standard

| Aspect | Laravel standard | Ce projet (legacy) |
|--------|-----------------|-------------------|
| Table | Convention auto (`users`) | Prefixe `t_` (`t_users`) |
| Timestamps | `created_at`, `updated_at` auto | Souvent absents |
| Cle primaire | `id` auto | Parfois custom (`site_id`) |
| Connexion | Default | `tenant` ou `mysql` |
| Soft deletes | `deleted_at` | Non utilise |
| Boolean | `true`/`false` | ENUM `'YES'`/`'NO'` ou `'Y'`/`'N'` |

### Modele type pour une table legacy

```php
namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    // 1. Specifier la connexion
    protected $connection = 'tenant';

    // 2. Specifier le nom de table exact
    protected $table = 't_users';

    // 3. Desactiver les timestamps si absents
    public $timestamps = false;

    // 4. Cle primaire custom si necessaire
    // protected $primaryKey = 'user_id';
    // public $incrementing = true; // ou false si UUID

    // 5. Lister les champs modifiables
    protected $fillable = [
        'username',
        'email',
        'password',
        'firstname',
        'lastname',
        'is_active',
    ];

    // 6. Cacher les champs sensibles
    protected $hidden = [
        'password',
    ];

    // 7. PAS de casts pour les ENUM (les garder en string)
    // Convertir dans la Resource si necessaire

    // 8. Relations avec les tables existantes
    public function groups()
    {
        return $this->belongsToMany(
            Group::class,
            't_user_group',    // Table pivot existante
            'user_id',          // FK dans la pivot vers user
            'group_id'          // FK dans la pivot vers group
        );
    }
}
```

---

## Les migrations

### Migrations centrales (base `site_dev1`)

Localisation : `database/migrations/`

Ces migrations creent les tables de Laravel (Sanctum, etc.) dans la base centrale :

```
database/migrations/
├── 0001_01_01_000000_create_users_table.php     # Table Laravel users (inutilisee)
├── 0001_01_01_000001_create_cache_table.php      # Table de cache
├── 0001_01_01_000002_create_jobs_table.php       # Table de jobs/queue
└── 2025_xx_xx_create_personal_access_tokens.php  # Tokens Sanctum
```

**Important** : La table `personal_access_tokens` (Sanctum) doit exister dans CHAQUE
base de donnees tenant, car les tokens sont stockes dans la base du tenant.

### Migrations tenant

Localisation : `database/migrations/tenant/`

Ces migrations s'executent sur chaque base de donnees tenant :

```bash
# Executer les migrations sur TOUS les tenants
php artisan tenants:migrate

# Executer sur un tenant specifique
php artisan tenants:run migration --tenant=1
```

**Regle** : Ne JAMAIS creer de migrations qui modifient les tables `t_*` existantes.
Les migrations tenant sont uniquement pour les tables NOUVELLES de Laravel
(ex: `personal_access_tokens`).

---

## Acces direct a la base de donnees (Tinker)

Pour explorer les donnees manuellement :

```bash
# Ouvrir le REPL Laravel
php artisan tinker
```

```php
// Dans Tinker :

// Voir les tenants
App\Models\Tenant::all()->pluck('site_host', 'site_id');
// → [1 => "client1.com", 2 => "client2.com", ...]

// Initialiser un tenant pour explorer sa base
$tenant = App\Models\Tenant::find(1);
tenancy()->initialize($tenant);

// Maintenant les requetes vont sur la base du tenant 1
Modules\UsersGuard\Entities\User::count();
// → 45

Modules\UsersGuard\Entities\User::first();
// → User {id: 1, username: "admin", ...}

// Voir les groupes d'un utilisateur
$user = Modules\UsersGuard\Entities\User::with('groups.permissions')->find(1);
$user->groups->pluck('name');
// → ["1-ADMINISTRATEUR THEME GES"]

$user->groups->first()->permissions->pluck('name');
// → ["admin", "contract_view", "settings_user", ...]

// Fin du contexte tenant
tenancy()->end();
```

---

## Les relations courantes entre tables

```
t_customers ──────────┐
                      │ customer_id
                      ▼
t_customers_contracts ─┬─── partner_id ────► t_partners_company
                      │
                      ├─── user_id ────────► t_users (commercial)
                      │
                      ├─── state_id ───────► t_contract_status
                      │                              │
                      │                              └──► t_contract_status_i18n
                      │
                      ├─── opc_state_id ───► t_contract_opc_status
                      │                              │
                      │                              └──► t_contract_opc_status_i18n
                      │
                      └─── (via pivot) ────► t_products_taxes

t_users ──┬─── (t_user_group) ────► t_groups
          │                              │
          │                              └── (t_group_permission) ──► t_permissions
          │
          └─── (t_user_permission) ──► t_permissions
```

---

## Conseils pratiques

### Verifier le schema d'une table

```bash
# Dans MySQL CLI ou phpMyAdmin
DESCRIBE t_customers_contracts;
SHOW CREATE TABLE t_customers_contracts;

# Voir les ENUM possibles d'une colonne
SHOW COLUMNS FROM t_domoprime_calculation WHERE Field = 'status';
```

### Deboguer les requetes SQL

```php
// Activer le log de requetes dans un controleur
DB::enableQueryLog();

$users = User::with('groups.permissions')->get();

dd(DB::getQueryLog());
// Affiche toutes les requetes SQL executees
```

### Verifier la connexion active

```php
// Quelle base de donnees est utilisee ?
dd(DB::connection('tenant')->getDatabaseName());
// → "db_client_abc"

dd(DB::connection('mysql')->getDatabaseName());
// → "site_dev1"
```

---

## Prochaine etape

**[10-GUIDE-PRATIQUE.md](10-GUIDE-PRATIQUE.md)** : Guide pas-a-pas pour ajouter
un module, un CRUD, debugger et tester.
