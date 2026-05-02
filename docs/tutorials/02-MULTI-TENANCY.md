# 2. Multi-Tenancy : Un Backend, N Bases de Donnees

## Le concept

"Multi-tenancy" signifie qu'une seule installation de votre application sert **plusieurs clients** (tenants).
Chaque client a ses propres donnees, completement isolees des autres.

Dans votre projet, chaque tenant a **sa propre base de donnees MySQL**. C'est le modele le plus securise :
meme en cas de bug, un client ne peut jamais voir les donnees d'un autre.

---

## Comment ca marche, etape par etape

### Etape 1 : La table centrale `t_sites`

Dans la base **centrale** (`site_dev1`), il y a une table `t_sites` qui sert d'annuaire :

```
t_sites
├── site_id          = 1
├── site_host        = "client-abc.monapp.com"
├── site_db_name     = "db_client_abc"
├── site_db_host     = "127.0.0.1"
├── site_db_port     = 3306
├── site_db_login    = "user_abc"
├── site_db_password = "secret123"
├── site_available   = "YES"
└── ...
```

Chaque ligne = un client. Chaque client a ses propres credentials de base de donnees.

### Etape 2 : Le middleware `InitializeTenancy`

**Fichier** : `app/Http/Middleware/InitializeTenancy.php`

Quand une requete arrive sur une route "tenant" (admin ou frontend), ce middleware s'execute **AVANT** votre controleur :

```
Requete HTTP
    │
    ▼
┌─────────────────────────────────┐
│  Middleware InitializeTenancy   │
│                                 │
│  1. Lire le header X-Tenant-ID │
│     (ex: "1" ou "client.com")  │
│                                 │
│  2. Chercher dans t_sites :    │
│     - Si numerique : WHERE     │
│       site_id = 1              │
│     - Si texte : WHERE         │
│       site_host = "client.com" │
│                                 │
│  3. Verifier site_available    │
│     = "YES"                    │
│                                 │
│  4. Appeler :                  │
│     tenancy()->initialize(     │
│       $tenant                  │
│     )                          │
│     → Bascule la connexion DB  │
│                                 │
│  5. Passer au controleur       │
│                                 │
│  6. Apres la reponse :         │
│     tenancy()->end()           │
│     → Revenir a la base        │
│       centrale                  │
└─────────────────────────────────┘
```

**Code simplifie** :

```php
// app/Http/Middleware/InitializeTenancy.php

public function handle(Request $request, Closure $next): Response
{
    $tenant = null;

    // Etape 1 : Lire X-Tenant-ID
    if ($request->hasHeader('X-Tenant-ID')) {
        $tenantId = $request->header('X-Tenant-ID');

        // Numerique = site_id, texte = domaine
        $tenant = is_numeric($tenantId)
            ? Tenant::where('site_id', $tenantId)->where('site_available', 'YES')->first()
            : Tenant::where('site_host', $tenantId)->where('site_available', 'YES')->first();
    }

    // Etape 2 : Fallback sur le domaine Host
    if (empty($tenant)) {
        $domain = $request->getHost();
        $tenant = Tenant::where('site_host', $domain)
            ->where('site_available', 'YES')
            ->first();
    }

    // Pas de tenant trouve ? Erreur 404
    if (!$tenant) {
        return response()->json([
            'success' => false,
            'message' => 'Tenant not found or not available'
        ], 404);
    }

    // Etape 3 : Basculer la connexion DB
    tenancy()->initialize($tenant);

    // Etape 4 : Executer le controleur normalement
    $response = $next($request);

    // Etape 5 : Revenir a la base centrale
    tenancy()->end();

    return $response;
}
```

### Etape 3 : Le basculement de base de donnees

Quand `tenancy()->initialize($tenant)` est appele, voici ce qui se passe en coulisses :

**Fichier** : `app/Providers/TenancyServiceProvider.php`

```php
// Quand un tenant est initialise...
Events\TenancyInitialized::class => [
    function (Events\TenancyInitialized $event) {
        $tenant = $event->tenancy->tenant;

        // Lire les credentials depuis le tenant (t_sites)
        $dbConfig = [
            'driver'    => 'mysql',
            'host'      => $tenant->site_db_host,
            'port'      => $tenant->site_db_port,
            'database'  => $tenant->site_db_name,
            'username'  => $tenant->site_db_login,
            'password'  => $tenant->site_db_password,
        ];

        // Configurer la connexion "tenant" avec ces credentials
        config(['database.connections.tenant' => $dbConfig]);

        // Reconnecter pour utiliser les nouveaux credentials
        DB::purge('tenant');
        DB::reconnect('tenant');

        // TOUTES les requetes sur la connexion "tenant"
        // utiliseront maintenant la base du client
    }
];
```

### Etape 4 : Les modeles utilisent la connexion "tenant"

Tous les modeles dans les modules (`Modules/*/Entities/`) utilisent la connexion `tenant` :

```php
// Modules/UsersGuard/Entities/User.php
class User extends Authenticatable
{
    protected $connection = 'tenant';  // ← Utilise la base du tenant actuel
    protected $table = 't_users';       // ← Table legacy Symfony 1
}
```

Quand vous faites `User::all()`, Laravel execute la requete sur la base de donnees
du tenant qui a ete initialise par le middleware. Pas besoin de preciser quelle base,
c'est automatique.

---

## Le modele Tenant

**Fichier** : `app/Models/Tenant.php`

```php
class Tenant extends BaseTenant
{
    protected $connection = 'mysql';  // Base CENTRALE (pas tenant)
    protected $table = 't_sites';     // Table legacy Symfony 1
    protected $primaryKey = 'site_id';
    public $timestamps = false;       // Pas de created_at/updated_at

    protected $fillable = [
        'site_host',
        'site_db_name',
        'site_db_host',
        'site_db_login',
        'site_db_password',
        'site_db_port',
        'site_available',
        // ...
    ];
}
```

Points cles :
- Ce modele est sur la connexion `mysql` (base centrale), pas `tenant`
- Il mappe la table existante `t_sites` de Symfony 1
- Pas de timestamps Laravel (le schema Symfony 1 n'en a pas)
- Le champ `site_available` doit etre `"YES"` pour qu'un tenant soit utilisable

---

## Configuration Tenancy

**Fichier** : `config/tenancy.php`

```php
return [
    'tenant_model' => \App\Models\Tenant::class,

    // Domaines centraux (pas des tenants)
    'central_domains' => ['127.0.0.1', 'localhost'],

    // Ce que le systeme de tenancy gere automatiquement :
    'bootstrappers' => [
        DatabaseTenancyBootstrapper::class,    // Bascule la DB
        CacheTenancyBootstrapper::class,       // Isole le cache par tenant
        FilesystemTenancyBootstrapper::class,  // Isole les fichiers par tenant
        QueueTenancyBootstrapper::class,       // Les jobs de queue gardent le contexte tenant
    ],
];
```

Les "bootstrappers" sont des mecanismes qui s'activent quand un tenant est initialise.
Chacun isole un aspect :
- **Database** : chaque tenant a sa propre base
- **Cache** : les cles de cache sont prefixees par l'ID du tenant (pas de collision)
- **Filesystem** : les fichiers uploades sont dans un dossier par tenant
- **Queue** : quand un job est mis en file d'attente, il garde le contexte du tenant

---

## Cote Frontend : comment le tenant est transmis

**Fichier** : `src/shared/lib/api-client.ts`

Le client HTTP (axios) injecte automatiquement le header `X-Tenant-ID` :

```typescript
// Intercepteur de requete (s'execute AVANT chaque appel API)
apiClient.interceptors.request.use((config) => {
    // Ajouter le token d'auth
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Ajouter le tenant ID (sauf pour les routes superadmin)
    if (!isSuperadminContext()) {
        const tenantId = localStorage.getItem('tenant_id');
        if (tenantId) {
            config.headers['X-Tenant-ID'] = tenantId;
        }
    }

    return config;
});
```

Le `tenant_id` est stocke dans `localStorage` au moment du login.

---

## Schema visuel complet

```
Frontend (Next.js)                    Backend (Laravel)
┌──────────────────┐                  ┌─────────────────────────┐
│                  │   GET /api/admin  │                         │
│  axios           │   /users         │  Route: admin.php       │
│  intercepteur:   │ ──────────────►  │  middleware: ['tenant',  │
│  X-Tenant-ID: 3  │                  │    'auth:sanctum']      │
│  Authorization:  │                  │                         │
│   Bearer xxx     │                  │  ┌───────────────────┐  │
│                  │                  │  │ InitializeTenancy │  │
└──────────────────┘                  │  │                   │  │
                                      │  │ X-Tenant-ID = 3   │  │
                                      │  │ → Cherche t_sites │  │
                                      │  │   WHERE id = 3    │  │
                                      │  │ → Trouve:         │  │
                                      │  │   db = "client3"  │  │
                                      │  │ → Configure       │  │
                                      │  │   connexion       │  │
                                      │  │   "tenant"        │  │
                                      │  └───────────────────┘  │
                                      │           │              │
                                      │           ▼              │
                                      │  ┌───────────────────┐  │
                                      │  │ UserController    │  │
                                      │  │ User::all()       │  │
                                      │  │ → Requete SQL sur │  │
                                      │  │   base "client3"  │  │
                                      │  └───────────────────┘  │
                                      │           │              │
                                      │           ▼              │
                                      │  ┌───────────────────┐  │
                                      │  │ tenancy()->end()  │  │
                                      │  │ → Revient a la    │  │
                                      │  │   base centrale   │  │
                                      │  └───────────────────┘  │
                                      └─────────────────────────┘
```

---

## Points critiques a retenir

1. **Le middleware `tenant` doit etre AVANT `auth:sanctum`** dans les routes admin/frontend.
   Sinon, Sanctum cherche le token dans la base centrale (ou l'utilisateur n'existe pas).

2. **Les routes superadmin n'ont PAS le middleware `tenant`**.
   Elles travaillent directement sur la base centrale.

3. **Chaque requete est isolee**. Le contexte tenant est initialise au debut
   et detruit a la fin. Pas de "fuite" entre requetes.

4. **Redis est necessaire** pour le cache et les sessions.
   Sans Redis, le cache serait partage entre tous les tenants (danger !).

5. **Ne jamais hardcoder un nom de base de donnees** dans le code.
   Toujours utiliser la connexion `tenant` qui est configuree dynamiquement.

---

## Prochaine etape

**[03-MODULES-LARAVEL.md](03-MODULES-LARAVEL.md)** : Comprendre le systeme modulaire
qui organise tout le code metier.
