# 4. Authentification : Login, Tokens et Refresh

## Vue d'ensemble

L'authentification utilise **Laravel Sanctum**, un systeme de tokens API simple.
Pas d'OAuth, pas de JWT complexe. Juste des tokens opaques stockes en base de donnees.

Il y a **deux flux d'authentification** separes :
1. **Tenant login** (admin/frontend) : cherche l'utilisateur dans la base du tenant
2. **Superadmin login** : cherche l'utilisateur dans la base centrale

---

## Flux 1 : Login Tenant (Admin)

### Backend

**Fichier** : `Modules/UsersGuard/Http/Controllers/Admin/AuthController.php`

```
POST /api/auth/login
Headers: X-Tenant-ID: 3
Body: { "username": "john", "password": "secret", "application": "admin" }
```

Voici ce qui se passe etape par etape :

```
┌────────────────────────────────────────────────────┐
│                   REQUETE LOGIN                      │
│  POST /api/auth/login                                │
│  X-Tenant-ID: 3                                      │
│  Body: { username, password, application: "admin" } │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  1. Middleware "tenant"                               │
│     → Lit X-Tenant-ID: 3                              │
│     → Cherche dans t_sites WHERE site_id = 3          │
│     → Bascule connexion vers base "client_3"          │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  2. AuthController@login                              │
│                                                       │
│  a) Validation :                                      │
│     - username : requis                               │
│     - password : requis                               │
│     - application : requis, in:admin,frontend         │
│                                                       │
│  b) Recherche utilisateur :                           │
│     User::where('username', 'john')                   │
│       ->orWhere('email', 'john')                      │
│       ->first()                                       │
│     → Cherche dans t_users de la base "client_3"      │
│                                                       │
│  c) Verification mot de passe :                       │
│     - Si MD5 (32 chars) : md5($password) == hash      │
│       → Migration automatique vers bcrypt !            │
│     - Si bcrypt (60 chars) : Hash::check()            │
│                                                       │
│  d) Verification du groupe :                          │
│     L'utilisateur doit appartenir a un groupe          │
│     dont t_groups.application = "admin"                │
│                                                       │
│  e) Creation du token Sanctum :                       │
│     $token = $user->createToken('auth-token', [        │
│       'role:admin',                                    │
│       'tenant:3'                                       │
│     ]);                                                │
│                                                       │
│  f) Mise a jour lastlogin                              │
│                                                       │
│  g) Chargement des permissions :                       │
│     → Groupes de l'utilisateur                         │
│     → Permissions de chaque groupe                     │
│     → Permissions directes de l'utilisateur             │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  3. Reponse JSON                                      │
│  {                                                    │
│    "success": true,                                   │
│    "data": {                                          │
│      "user": {                                        │
│        "id": 42,                                      │
│        "username": "john",                            │
│        "email": "john@example.com",                   │
│        "groups": [                                    │
│          {                                            │
│            "id": 1,                                   │
│            "name": "1-ADMINISTRATEUR",                │
│            "application": "admin",                    │
│            "permissions": [                           │
│              { "name": "admin" },                     │
│              { "name": "contract_view" },             │
│              { "name": "settings_user" }              │
│            ]                                          │
│          }                                            │
│        ],                                             │
│        "permissions": [                               │
│          { "name": "special_perm" }                   │
│        ]                                              │
│      },                                               │
│      "token": "3|abc123xyz...",                        │
│      "token_type": "Bearer"                           │
│    }                                                  │
│  }                                                    │
└──────────────────────────────────────────────────────┘
```

### Migration automatique MD5 → bcrypt

Le projet Symfony 1 utilisait MD5 pour hasher les mots de passe. C'est obsolete et peu securise.
Le backend detecte automatiquement les mots de passe MD5 et les migre vers bcrypt :

```php
// Si le hash fait 32 caracteres → c'est du MD5
if (strlen($user->password) === 32) {
    if (md5($password) === $user->password) {
        // Mot de passe correct, on le migre vers bcrypt
        $user->password = Hash::make($password);
        $user->save();
        return true; // authentifie
    }
}
// Sinon c'est du bcrypt, verification standard
return Hash::check($password, $user->password);
```

Chaque utilisateur qui se connecte voit son mot de passe automatiquement migre.
C'est transparent pour l'utilisateur.

---

## Flux 2 : Login Superadmin

**Fichier** : `Modules/UsersGuard/Http/Controllers/Superadmin/AuthController.php`

```
POST /api/superadmin/auth/login
Body: { "username": "superadmin", "password": "secret", "application": "superadmin" }
```

Meme logique que le login tenant, SAUF :
- **Pas de middleware `tenant`** → utilise la base centrale `site_dev1`
- Le token a l'ability `role:superadmin` (pas de tenant specifique)
- Cherche dans `t_users` de la base CENTRALE

---

## Cote Frontend : gestion du login

### Service d'authentification

**Fichier** : `src/modules/UsersGuard/admin/services/authService.ts`

```typescript
class AdminAuthService {
    async login(username: string, password: string): Promise<LoginResponse> {
        // 1. Appel API
        const response = await apiClient.post('/admin/auth/login', {
            username,
            password,
            application: 'admin'
        });

        // 2. Stocker le token
        localStorage.setItem('auth_token', response.data.data.token);

        // 3. Stocker le timestamp (pour le refresh)
        localStorage.setItem('auth_token_issued_at', Date.now().toString());

        // 4. Stocker l'utilisateur (avec ses permissions)
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        // 5. Stocker les infos du tenant
        localStorage.setItem('tenant', JSON.stringify(response.data.data.tenant));

        return response.data;
    }
}
```

### Hook useAuth

**Fichier** : `src/modules/UsersGuard/admin/hooks/useAuth.ts`

```typescript
function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Verifie l'authentification au chargement
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (username: string, password: string) => {
        const response = await authService.login(username, password);
        setUser(response.data.user);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await authService.logout(); // Appel API pour invalider le token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
    };

    return { user, isAuthenticated, login, logout };
}
```

---

## Gestion des tokens

### Sanctum : comment ca marche

Laravel Sanctum cree des tokens dans la table `personal_access_tokens` :

```
personal_access_tokens
├── id            = 3
├── tokenable_type = "Modules\UsersGuard\Entities\User"
├── tokenable_id  = 42          # L'ID de l'utilisateur
├── name          = "auth-token"
├── token         = "sha256hash..." # Hash du token
├── abilities     = ["role:admin", "tenant:3"]
├── expires_at    = "2025-01-15 14:30:00"
├── created_at    = "2025-01-15 13:30:00"
└── updated_at    = "2025-01-15 13:30:00"
```

Le token envoye au frontend est : `{id}|{token_en_clair}` (ex: `3|abc123xyz...`).
Laravel ne stocke que le hash SHA-256 du token en base. Meme en cas de fuite de la
base de donnees, les tokens ne sont pas exploitables.

### Expiration et Refresh

**Configuration** : Le token expire apres **60 minutes** (`SANCTUM_EXPIRATION=60`).

**Cote frontend** : Un systeme de refresh proactif :

```typescript
// Le token est rafraichi AVANT qu'il n'expire

const TOKEN_LIFETIME = 60 * 60 * 1000;   // 60 minutes en ms
const REFRESH_THRESHOLD = 50 * 60 * 1000; // Rafraichir a 50 minutes
const CHECK_INTERVAL = 5 * 60 * 1000;     // Verifier toutes les 5 minutes

function setupTokenRefresh() {
    setInterval(async () => {
        const issuedAt = localStorage.getItem('auth_token_issued_at');
        if (!issuedAt) return;

        const elapsed = Date.now() - parseInt(issuedAt);

        // Si le token a plus de 50 minutes, le rafraichir
        if (elapsed > REFRESH_THRESHOLD) {
            const newToken = await authService.refreshToken();
            if (newToken) {
                localStorage.setItem('auth_token', newToken);
                localStorage.setItem('auth_token_issued_at', Date.now().toString());
            }
        }
    }, CHECK_INTERVAL);
}
```

**Le refresh fonctionne ainsi** :
1. Toutes les 5 minutes, le frontend verifie l'age du token
2. Si le token a plus de 50 minutes (sur 60), il envoie `POST /api/auth/refresh`
3. Le backend supprime l'ancien token et en cree un nouveau
4. Le frontend stocke le nouveau token

### Gestion du 401 (token expire)

Si malgre tout le token expire (ex: l'utilisateur revient apres 2h), l'intercepteur axios gere :

```typescript
// src/shared/lib/api-client.ts

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
            error.config._retry = true; // Eviter boucle infinie

            // Tenter un refresh
            const newToken = await authService.refreshToken();

            if (newToken) {
                // Rejouer la requete originale avec le nouveau token
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(error.config);
            }

            // Refresh echoue → deconnexion
            authService.logout();
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);
```

---

## Verification d'authentification (middleware Sanctum)

A chaque requete protegee par `auth:sanctum`, Laravel :

1. Lit le header `Authorization: Bearer 3|abc123xyz...`
2. Extrait l'ID du token (3) et le token en clair
3. Cherche dans `personal_access_tokens` WHERE id = 3
4. Compare le hash SHA-256 du token envoye avec celui en base
5. Verifie que `expires_at` n'est pas depasse
6. Charge l'utilisateur (`tokenable_type` + `tokenable_id`)
7. Met l'utilisateur dans `$request->user()`

Si une de ces etapes echoue → reponse 401 Unauthorized.

---

## Schema complet du flux d'auth

```
FRONTEND                              BACKEND
┌──────────┐                          ┌──────────────────┐
│ LoginForm│  POST /api/auth/login    │                  │
│          │ ─────────────────────►   │ InitializeTenancy│
│          │  X-Tenant-ID: 3          │ → Bascule DB     │
│          │  {username, password}     │                  │
│          │                          │ AuthController   │
│          │                          │ → Verifie mdp    │
│          │                          │ → Cree token     │
│          │   {token, user, perms}    │ → Charge perms   │
│          │ ◄─────────────────────   │                  │
│          │                          └──────────────────┘
│ Stocke:  │
│ - token  │
│ - user   │
│ - perms  │
│ - tenant │
└──────────┘
     │
     │ Toute requete suivante :
     │
     ▼
┌──────────┐                          ┌──────────────────┐
│ axios    │  GET /api/admin/users    │                  │
│ intercep.│ ─────────────────────►   │ InitializeTenancy│
│          │  Authorization: Bearer x  │ auth:sanctum     │
│          │  X-Tenant-ID: 3          │ credential:...   │
│          │                          │                  │
│          │  {success, data, meta}    │ UserController   │
│          │ ◄─────────────────────   │ → Repository     │
│          │                          │ → Resource       │
└──────────┘                          └──────────────────┘
     │
     │ Toutes les 5 minutes :
     │
     ▼
┌──────────┐                          ┌──────────────────┐
│ Timer    │  POST /api/auth/refresh  │                  │
│          │ ─────────────────────►   │ Supprime ancien  │
│          │  Authorization: Bearer x  │ token, cree      │
│          │                          │ nouveau          │
│          │  {new_token}              │                  │
│          │ ◄─────────────────────   │                  │
│ Stocke   │                          └──────────────────┘
│ nouveau  │
│ token    │
└──────────┘
```

---

## Points cles a retenir

1. **Deux types de login** : tenant (X-Tenant-ID requis) et superadmin (pas de tenant)
2. **Migration automatique MD5 → bcrypt** pour compatibilite Symfony 1
3. **Le token contient des "abilities"** : `role:admin` et `tenant:3`
4. **Refresh proactif** a 50 min sur 60 min de duree de vie
5. **L'intercepteur axios 401** tente un refresh avant de deconnecter
6. **Les permissions sont envoyees au login** → zero appel API supplementaire
7. **Le middleware `tenant` doit etre AVANT `auth:sanctum`** dans les routes

---

## Prochaine etape

**[05-PERMISSIONS.md](05-PERMISSIONS.md)** : Le systeme de permissions compatible Symfony 1.
