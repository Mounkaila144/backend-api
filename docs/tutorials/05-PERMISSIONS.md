# 5. Le Systeme de Permissions (Compatible Symfony 1)

## Contexte historique

Dans Symfony 1, les permissions s'appellent des **credentials**. L'API utilise les deux termes
de facon interchangeable. Le systeme ici est une **reimplementation fidele** du systeme
Symfony 1 pour ne pas casser la compatibilite.

---

## Architecture des tables

```
t_groups                          t_permissions
├── id                            ├── id
├── name ("1-ADMINISTRATEUR")     ├── name ("contract_view")
├── application ("admin")         ├── description
└── ...                           ├── group_id (0 = standalone)
                                  └── application
         │                                  │
         │ t_group_permission               │
         │ ├── group_id ────────────────────┘
         │ └── permission_id ───────────────┘
         │
         │ t_user_group
         │ ├── user_id
         │ └── group_id
         │
         ▼
t_users
├── id
├── username
└── ...
    │
    │ t_user_permission (permissions directes)
    │ ├── user_id
    │ └── permission_id
    └──────────────────
```

**Trois sources de permissions pour un utilisateur** :
1. Les **groupes** auxquels il appartient (`t_user_group`)
2. Les **permissions des groupes** (`t_group_permission`)
3. Ses **permissions directes** (`t_user_permission`)

---

## Le concept cle : "admin" et "superadmin" sont des PERMISSIONS

Dans Symfony 1, `admin` et `superadmin` ne sont PAS des noms de groupes.
Ce sont des **permissions** (credentials) qui sont attribuees a certains groupes.

Exemple :
- Le groupe "1-ADMINISTRATEUR THEME GES" a la permission `admin` (via `t_group_permission`)
- Le groupe "SUPER-ADMIN" a la permission `superadmin`
- Un utilisateur dans le groupe "1-ADMINISTRATEUR" a automatiquement la permission `admin`

C'est pourquoi quand on verifie `hasCredential('admin')`, on regarde dans les
permissions (pas dans les noms de groupes).

---

## Backend : le trait HasPermissions

**Fichier** : `app/Traits/HasPermissions.php`

Ce trait est utilise par le modele `User`. Il fournit toutes les methodes de verification.

### Chargement des permissions (cache O(1))

```php
trait HasPermissions
{
    // Cache en memoire (vit le temps d'une requete)
    private ?Collection $cachedPermissions = null;
    private ?array $cachedPermissionIndex = null;  // array_flip pour O(1)
    private ?array $cachedGroupIndex = null;        // array_flip pour O(1)
    private ?bool $cachedIsSuperadmin = null;

    /**
     * Charge TOUTES les permissions de l'utilisateur (groupes + directes)
     * et les met en cache pour la duree de la requete
     */
    public function getAllPermissions(): Collection
    {
        if ($this->cachedPermissions !== null) {
            return $this->cachedPermissions;  // Deja en cache
        }

        // 1. Permissions venant des groupes
        $groupPermissions = collect();
        foreach ($this->groups as $group) {
            foreach ($group->permissions as $perm) {
                $groupPermissions->push($perm->name);
            }
        }

        // 2. Permissions directes de l'utilisateur
        $directPermissions = $this->permissions->pluck('name');

        // 3. Fusion et deduplication
        $this->cachedPermissions = $groupPermissions
            ->merge($directPermissions)
            ->unique();

        // 4. Index inverse pour recherche O(1)
        //    ['contract_view' => 0, 'admin' => 1, ...]
        $this->cachedPermissionIndex = array_flip(
            $this->cachedPermissions->toArray()
        );

        return $this->cachedPermissions;
    }
}
```

**Pourquoi `array_flip` ?**

Sans index : `in_array('contract_view', $permissions)` → O(n), parcourt tout le tableau.
Avec index : `isset($index['contract_view'])` → O(1), acces direct par cle.

Pour un utilisateur avec 50 permissions, c'est 50x plus rapide.

### La methode principale : hasCredential

```php
/**
 * Verifie si l'utilisateur a un credential (compatible Symfony 1)
 *
 * Exemples d'utilisation :
 *   hasCredential('admin')                          → a-t-il "admin" ?
 *   hasCredential(['admin', 'superadmin'])           → a-t-il admin OU superadmin ?
 *   hasCredential([['admin', 'superadmin', 'view']]) → a-t-il admin OU superadmin OU view ?
 *   hasCredential(['perm1', 'perm2'], true)          → a-t-il perm1 ET perm2 ?
 */
public function hasCredential($credentials, bool $useAnd = false): bool
{
    // Superadmin bypass : acces a TOUT
    if ($this->isSuperadmin()) {
        return true;
    }

    // String simple : verifie une seule permission
    if (is_string($credentials)) {
        return $this->hasPermissionDirect($credentials);
    }

    // Tableau : logique OR ou AND
    if (is_array($credentials)) {
        foreach ($credentials as $credential) {
            // Sous-tableau = logique OR (compatible Symfony 1)
            if (is_array($credential)) {
                foreach ($credential as $c) {
                    if ($this->hasPermissionDirect($c)) {
                        return true;  // Au moins un = OK
                    }
                }
                return false;
            }

            $has = $this->hasPermissionDirect($credential);

            if ($useAnd && !$has) return false;   // AND : un manquant = echec
            if (!$useAnd && $has) return true;     // OR : un present = succes
        }

        return $useAnd; // AND: tous presents | OR: aucun present
    }

    return false;
}
```

### Verification d'une permission individuelle

```php
private function hasPermissionDirect(string $permission): bool
{
    // Charger les permissions si pas encore fait
    $this->getAllPermissions();

    // O(1) : lookup dans l'index inverse
    if (isset($this->cachedPermissionIndex[$permission])) {
        return true;
    }

    // Verifier aussi dans les noms de groupes
    // (car "admin" et "superadmin" viennent souvent des groupes)
    if (isset($this->cachedGroupIndex[$permission])) {
        return true;
    }

    return false;
}
```

### Verification Superadmin

```php
public function isSuperadmin(): bool
{
    if ($this->cachedIsSuperadmin !== null) {
        return $this->cachedIsSuperadmin;
    }

    $this->cachedIsSuperadmin = false;

    foreach ($this->groups as $group) {
        // Verifie si un des groupes a l'application "superadmin"
        if ($group->application === 'superadmin') {
            $this->cachedIsSuperadmin = true;
            break;
        }
        // OU si un des groupes a la permission "superadmin"
        foreach ($group->permissions as $perm) {
            if ($perm->name === 'superadmin') {
                $this->cachedIsSuperadmin = true;
                break 2;
            }
        }
    }

    return $this->cachedIsSuperadmin;
}
```

---

## Le middleware Credential

**Fichier** : `app/Http/Middleware/CheckCredential.php`

Ce middleware s'utilise dans les routes pour proteger les endpoints :

```php
// Routes/admin.php

// OR logic : l'utilisateur doit avoir AU MOINS UN des credentials
Route::get('/users', [UserController::class, 'index'])
    ->middleware('credential:admin,superadmin,settings_user_list');
    // → a "admin" OU "superadmin" OU "settings_user_list"

// AND logic : l'utilisateur doit avoir TOUS les credentials
Route::get('/sensitive', [SensitiveController::class, 'index'])
    ->middleware('credential:admin+sensitive_data');
    // → a "admin" ET "sensitive_data"
```

**Implementation** :

```php
class CheckCredential
{
    public function handle(Request $request, Closure $next, string $credentials): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Detecter la logique AND (separateur +) ou OR (separateur ,)
        if (str_contains($credentials, '+')) {
            // AND logic
            $perms = explode('+', $credentials);
            if (!$user->hasCredential($perms, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient permissions'
                ], 403);
            }
        } else {
            // OR logic
            $perms = explode(',', $credentials);
            if (!$user->hasCredential($perms)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient permissions'
                ], 403);
            }
        }

        return $next($request);
    }
}
```

---

## Frontend : PermissionsContext

**Fichier** : `src/shared/contexts/PermissionsContext.tsx`

Les permissions sont extraites de la reponse du login (zero appel API supplementaire)
et stockees dans un Context React avec des `Set` pour des lookups O(1).

### Extraction des permissions

```typescript
// src/shared/lib/permissions/extractPermissions.ts

function extractPermissions(user: LoginUser): UserPermissions {
    const permissionSet = new Set<string>();
    const groupSet = new Set<string>();
    let isSuperadmin = false;
    let isAdmin = false;

    // 1. Parcourir les groupes de l'utilisateur
    for (const group of user.groups || []) {
        // Ajouter le nom du groupe
        groupSet.add(group.name);

        // Detecter admin/superadmin par le champ application
        if (group.application === 'superadmin') isSuperadmin = true;
        if (group.application === 'admin') isAdmin = true;

        // Ajouter les permissions du groupe
        for (const perm of group.permissions || []) {
            permissionSet.add(perm.name);

            // Detecter admin/superadmin par la permission
            if (perm.name === 'superadmin') isSuperadmin = true;
            if (perm.name === 'admin') isAdmin = true;
        }
    }

    // 2. Ajouter les permissions directes
    for (const perm of user.permissions || []) {
        permissionSet.add(perm.name);
    }

    return {
        permissions: Array.from(permissionSet),
        groups: Array.from(groupSet),
        is_superadmin: isSuperadmin,
        is_admin: isAdmin,
        user_id: user.id,
        username: user.username,
    };
}
```

### Le Context React

```typescript
// src/shared/contexts/PermissionsContext.tsx

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

function PermissionsProvider({ children }) {
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);

    // Charger depuis localStorage au montage
    useEffect(() => {
        const stored = localStorage.getItem('user_permissions');
        if (stored) {
            setPermissions(JSON.parse(stored));
        }
    }, []);

    // Set pour lookup O(1)
    const permissionSet = useMemo(
        () => new Set(permissions?.permissions || []),
        [permissions]
    );

    const groupSet = useMemo(
        () => new Set(permissions?.groups || []),
        [permissions]
    );

    /**
     * hasCredential - Replique exacte du comportement Symfony 1
     */
    const hasCredential = useCallback((
        credentials: string | string[] | string[][],
        useAnd = false
    ): boolean => {
        if (!permissions) return false;
        if (permissions.is_superadmin) return true;

        if (typeof credentials === 'string') {
            return permissionSet.has(credentials) || groupSet.has(credentials);
        }

        if (Array.isArray(credentials)) {
            for (const cred of credentials) {
                if (Array.isArray(cred)) {
                    // Sous-tableau = OR
                    for (const c of cred) {
                        if (permissionSet.has(c) || groupSet.has(c)) return true;
                    }
                    return false;
                }

                const has = permissionSet.has(cred) || groupSet.has(cred);
                if (useAnd && !has) return false;
                if (!useAnd && has) return true;
            }
            return useAnd;
        }

        return false;
    }, [permissions, permissionSet, groupSet]);

    return (
        <PermissionsContext.Provider value={{
            permissions,
            hasCredential,
            hasGroup: (g) => groupSet.has(g),
            isSuperadmin: permissions?.is_superadmin ?? false,
            isAdmin: permissions?.is_admin ?? false,
        }}>
            {children}
        </PermissionsContext.Provider>
    );
}
```

### Utilisation dans les composants

```typescript
function UserManagementPage() {
    const { hasCredential, isSuperadmin } = usePermissions();

    // Verifier si l'utilisateur peut voir cette page
    if (!hasCredential(['admin', 'superadmin', 'settings_user_list'])) {
        return <AccessDenied />;
    }

    // Verifier des actions specifiques
    const canEdit = hasCredential(['admin', 'superadmin', 'settings_user']);
    const canDelete = isSuperadmin;

    return (
        <div>
            <UserTable />
            {canEdit && <EditButton />}
            {canDelete && <DeleteButton />}
        </div>
    );
}
```

---

## Schema des permissions de bout en bout

```
LOGIN                        STOCKAGE                    UTILISATION
┌─────────┐                  ┌──────────────┐            ┌───────────────┐
│ Backend │                  │ localStorage │            │ Composant     │
│ envoie: │   extractPerms   │              │  usePerms  │ React         │
│ user {  │ ──────────────►  │ permissions: │ ─────────► │               │
│  groups:│                  │  Set('admin',│            │ hasCredential │
│   [{    │                  │    'view',..)│            │ ('admin') ?   │
│    name,│                  │              │            │ → true        │
│    perms│                  │ groups:      │            │               │
│   }]    │                  │  Set('ADMIN')│            │ Affiche ou    │
│  perms: │                  │              │            │ cache le      │
│   [..]  │                  │ isSuperadmin:│            │ bouton        │
│ }       │                  │  false       │            │               │
└─────────┘                  └──────────────┘            └───────────────┘

BACKEND VERIFIE AUSSI (double securite)
┌─────────────────────────────────────────────┐
│ Route: ->middleware('credential:admin,...')  │
│ → CheckCredential middleware                │
│ → $request->user()->hasCredential(...)      │
│ → 403 si refuse                              │
└─────────────────────────────────────────────┘
```

**Double securite** : Le frontend cache les boutons/pages, mais le BACKEND refuse aussi
les requetes non autorisees. Un utilisateur malveillant qui modifie le frontend ne peut
pas contourner les permissions.

---

## Correspondance Symfony 1 ↔ Laravel

| Symfony 1 | Laravel (ce projet) |
|-----------|-------------------|
| `$sf_user->hasCredential('admin')` | `$user->hasCredential('admin')` |
| `$sf_user->hasCredential([['a','b']])` | `$user->hasCredential([['a','b']])` |
| `security.yml: credentials: [admin]` | `->middleware('credential:admin')` |
| `sfGuardGroup` | `t_groups` (meme table) |
| `sfGuardPermission` | `t_permissions` (meme table) |
| `sfGuardUserGroup` | `t_user_group` (meme table) |
| `sfGuardGroupPermission` | `t_group_permission` (meme table) |

La migration est 100% transparente pour les utilisateurs existants.

---

## Prochaine etape

**[06-CYCLE-DE-VIE-REQUETE.md](06-CYCLE-DE-VIE-REQUETE.md)** : Suivre une requete
de bout en bout, du clic utilisateur a la reponse JSON.
