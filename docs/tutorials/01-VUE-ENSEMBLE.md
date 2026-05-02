# 1. Vue d'Ensemble du Projet

## Contexte : d'ou on vient, ou on va

Vous aviez un projet **Symfony 1** (un framework PHP ancien, circa 2007-2012).
Ce projet gere une application multi-tenant : chaque client (site) a sa propre base de donnees.
L'objectif est de migrer vers :

- **Backend** : Laravel 11 (API REST pure, pas de vues HTML)
- **Frontend** : Next.js 15 (React, rendu cote serveur + client)

La contrainte majeure : **les tables de la base de donnees existantes ne doivent PAS etre modifiees**.
Les modeles Laravel s'adaptent au schema existant (tables en `t_`, pas de timestamps Laravel, cles primaires custom).

---

## Architecture a 30 000 pieds

```
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATEUR                            │
│  Next.js 15 (React + MUI + TanStack Table)              │
│  Port 3000                                              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (axios)
                       │ Headers: Authorization, X-Tenant-ID, Accept-Language
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 LARAVEL 11 API                           │
│  Port 8000                                              │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Superadmin  │  │    Admin     │  │   Frontend    │  │
│  │ /api/super  │  │ /api/admin   │  │ /api/frontend │  │
│  │ admin/*     │  │ /*           │  │ /*            │  │
│  │             │  │              │  │               │  │
│  │ Base        │  │ Base tenant  │  │ Base tenant   │  │
│  │ centrale    │  │ + auth       │  │ (public/auth) │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                   │          │
└─────────┼────────────────┼───────────────────┼──────────┘
          │                │                   │
          ▼                ▼                   ▼
┌──────────────┐  ┌──────────────┐   ┌──────────────┐
│ Base Centrale│  │ Base Tenant 1│   │ Base Tenant 2│
│  site_dev1   │  │ client_abc   │   │ client_xyz   │
│              │  │              │   │              │
│  t_sites     │  │ t_users      │   │ t_users      │
│  (liste des  │  │ t_groups     │   │ t_groups     │
│   tenants)   │  │ t_contracts  │   │ t_contracts  │
│              │  │ ...          │   │ ...          │
└──────────────┘  └──────────────┘   └──────────────┘
```

---

## Les 3 couches (layers)

Le projet separe strictement 3 contextes d'utilisation :

### 1. Superadmin (`/api/superadmin/*`)
- **Qui** : L'operateur de la plateforme (vous, le proprietaire du SaaS)
- **Base de donnees** : Centrale (`site_dev1`)
- **Middleware** : `auth:sanctum` uniquement (PAS de tenant)
- **Usage** : Gerer les sites/tenants, creer de nouveaux clients
- **Fichiers** : `Modules/*/Http/Controllers/Superadmin/`, `Modules/*/Routes/superadmin.php`

### 2. Admin (`/api/admin/*`)
- **Qui** : L'administrateur d'un site client specifique
- **Base de donnees** : Celle du tenant (determinee par `X-Tenant-ID`)
- **Middleware** : `tenant` + `auth:sanctum`
- **Usage** : Gerer les utilisateurs, contrats, produits de CE client
- **Fichiers** : `Modules/*/Http/Controllers/Admin/`, `Modules/*/Routes/admin.php`

### 3. Frontend (`/api/frontend/*`)
- **Qui** : Les utilisateurs finaux du site client
- **Base de donnees** : Celle du tenant
- **Middleware** : `tenant` (+ optionnellement `auth:sanctum` pour les routes protegees)
- **Usage** : Consultation publique + actions authentifiees
- **Fichiers** : `Modules/*/Http/Controllers/Frontend/`, `Modules/*/Routes/frontend.php`

---

## Les technologies cles et pourquoi

| Technologie | Role | Pourquoi ce choix |
|-------------|------|-------------------|
| **Laravel 11** | Framework PHP backend | Ecosysteme riche, Eloquent ORM, migrations, Sanctum |
| **nwidart/laravel-modules** | Architecture modulaire | Separer le code par domaine metier (Contrats, Users, etc.) |
| **stancl/tenancy 3.9** | Multi-tenancy | Gestion automatique des connexions DB par tenant |
| **Laravel Sanctum** | Authentification API | Tokens simples, pas besoin d'OAuth pour une API interne |
| **Next.js 15** | Framework React frontend | SSR, App Router, performance |
| **MUI 6** | Composants UI | Design system complet, RTL support (arabe) |
| **TanStack React Table** | Tableaux de donnees | Tri, filtrage, pagination cote client |
| **Axios** | Client HTTP | Intercepteurs pour tokens et tenant ID |
| **Redis** | Cache + Sessions | Isolation multi-tenant du cache |

---

## Structure des dossiers (Backend)

```
C:\laragon\www\backend-api\
│
├── app/                          # Code Laravel central
│   ├── Http/
│   │   ├── Controllers/          # Controleurs centraux (peu nombreux)
│   │   └── Middleware/           # CRUCIAL : InitializeTenancy, CheckCredential, CheckPermission
│   ├── Models/                   # Modeles centraux (Tenant, User superadmin)
│   ├── Traits/                   # HasPermissions (systeme de permissions)
│   ├── Tenancy/                  # CustomDatabaseConfig
│   ├── Providers/                # TenancyServiceProvider, AppServiceProvider
│   ├── Helpers/                  # permissions.php (fonctions globales)
│   └── Search/                   # Integration Meilisearch
│
├── Modules/                      # 27 modules metier
│   ├── CustomersContracts/       # Exemple de module complet
│   │   ├── Entities/             # Modeles Eloquent (connexion tenant)
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Admin/        # CRUD admin (tenant DB)
│   │   │   │   ├── Superadmin/   # Operations centrales
│   │   │   │   └── Frontend/     # Operations publiques
│   │   │   └── Resources/        # Transformation JSON
│   │   ├── Repositories/         # Acces aux donnees
│   │   ├── Routes/
│   │   │   ├── admin.php         # Routes tenant + auth
│   │   │   ├── superadmin.php    # Routes centrales
│   │   │   └── frontend.php      # Routes publiques
│   │   └── module.json           # Metadata du module
│   ├── User/
│   ├── UsersGuard/               # Authentification
│   ├── Partner/
│   ├── Product/
│   └── ... (22 autres modules)
│
├── config/
│   ├── database.php              # Connexions MySQL, Redis
│   └── tenancy.php               # Configuration multi-tenant
│
├── routes/
│   └── api.php                   # Routes centrales (health, permissions)
│
├── bootstrap/
│   └── app.php                   # Enregistrement des middlewares
│
└── composer.json                 # Dependances PHP
```

## Structure des dossiers (Frontend)

```
C:\Users\Mounkaila\WebstormProjects\icall26-front\src\
│
├── app/                          # Next.js App Router
│   ├── [lang]/                   # Route dynamique pour la langue (fr, en, ar)
│   │   ├── admin/                # Pages admin
│   │   │   ├── layout.tsx        # Layout admin (sidebar, navbar)
│   │   │   ├── login/            # Page de login
│   │   │   ├── dashboard/        # Tableau de bord
│   │   │   ├── users/            # Gestion utilisateurs
│   │   │   └── [...slug]/        # Route catch-all (charge les modules dynamiquement)
│   │   ├── superadmin/           # Pages superadmin
│   │   │   ├── layout.tsx
│   │   │   └── [...slug]/
│   │   └── layout.tsx            # Layout racine (providers)
│   └── api/auth/                 # NextAuth.js endpoints
│
├── modules/                      # Modules frontend (miroir du backend)
│   ├── UsersGuard/               # Auth (login, tokens)
│   │   ├── admin/
│   │   │   ├── components/       # LoginForm, etc.
│   │   │   ├── hooks/            # useAuth()
│   │   │   └── services/         # authService.ts (appels API)
│   │   └── superadmin/
│   ├── CustomersContracts/       # Contrats
│   ├── Users/                    # Gestion users
│   └── ...
│
├── shared/                       # Code partage
│   ├── lib/
│   │   ├── api-client.ts         # Client axios (injecte token + tenant ID)
│   │   └── tenant-context.tsx    # Context React pour le tenant
│   └── contexts/
│       └── PermissionsContext.tsx # Permissions O(1) avec Set
│
├── @core/                        # Theme MUI (couleurs, composants de base)
├── @layouts/                     # Layouts (vertical, horizontal)
├── @menu/                        # Systeme de menu/navigation
│
└── components/
    └── shared/
        └── DataTable/            # Wrapper TanStack React Table
```

---

## Comment les pieces s'emboitent (flux simplifie)

1. **L'utilisateur ouvre le frontend** (Next.js sur `localhost:3000`)
2. **Il se connecte** : le frontend envoie `POST /api/auth/login` avec `X-Tenant-ID`
3. **Le backend** :
   - Le middleware `tenant` lit `X-Tenant-ID`, trouve le tenant dans `site_dev1.t_sites`
   - Bascule la connexion DB vers la base du tenant
   - Verifie username/password dans `t_users` du tenant
   - Cree un token Sanctum
   - Retourne le token + les permissions de l'utilisateur
4. **Le frontend stocke** le token dans `localStorage`
5. **Pour chaque requete suivante**, le frontend injecte automatiquement :
   - `Authorization: Bearer {token}` (via intercepteur axios)
   - `X-Tenant-ID: {id}` (via intercepteur axios)
6. **Le backend** re-initialise le contexte tenant a chaque requete, verifie le token, verifie les permissions, execute la logique, retourne du JSON

---

## Prochaine etape

Maintenant que vous avez la vue d'ensemble, passez au tutoriel suivant :
**[02-MULTI-TENANCY.md](02-MULTI-TENANCY.md)** pour comprendre en detail comment fonctionne le multi-tenancy.
