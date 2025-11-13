# Système de Permissions et Rôles - Documentation API

## ✅ Migration Symfony 1 → Laravel - 100% Compatible

Ce système reproduit **exactement** le comportement de Symfony 1 `hasCredential()` dans Laravel 11.

### Compatibilité Symfony 1

| Symfony 1 | Laravel | Comportement identique |
|-----------|---------|----------------------|
| `$user->hasCredential('admin')` | `$user->hasPermission('admin')` | ✅ Vérifie groupe **OU** permission |
| `$user->hasCredential([['admin', 'superadmin']])` | `$user->hasPermission([['admin', 'superadmin']])` | ✅ Logique OR (au moins un) |
| `$user->hasGroups('admin')` | `$user->groups->contains('name', 'admin')` | ✅ Vérifie groupe uniquement |

### 🔑 Comportement clé : hasPermission() = hasCredential()

**Important** : Comme dans Symfony 1, `hasPermission()` vérifie **d'abord les groupes, puis les permissions** !

```php
// L'utilisateur a le groupe "1-FIDEALIS"
$user->hasPermission('1-FIDEALIS')  // ✅ true (groupe trouvé)

// L'utilisateur a la permission "settings_user"
$user->hasPermission('settings_user')  // ✅ true (permission trouvée)

// Logique OR - au moins un groupe/permission
$user->hasPermission([['admin', 'superadmin', 'users.edit']])  // ✅ true si AU MOINS UN existe
```

## Vue d'ensemble

Ce système de permissions est conçu pour Laravel 11 API + Next.js frontend. Il utilise vos tables existantes de la base de données (compatibilité totale Symfony 1).

### Tables utilisées (mêmes que Symfony 1)
- `t_groups` - Les rôles/groupes (admin, superadmin, 1-FIDEALIS, etc.)
- `t_permissions` - Les permissions individuelles (users.edit, settings_user, etc.)
- `t_group_permission` - Liaison groupes ↔ permissions
- `t_user_group` - Liaison utilisateurs ↔ groupes
- `t_user_permission` - Permissions directes utilisateur (optionnel)

## Architecture

### Backend (Laravel)
1. **Trait `HasPermissions`** - Ajouté au modèle User, fournit toutes les méthodes de vérification
2. **Middleware `permission`** - Protège les routes API
3. **API Endpoints** - Pour que Next.js puisse vérifier les permissions
4. **Helpers PHP** - Fonctions globales pour usage serveur

### Frontend (Next.js)
1. **Hook personnalisé** - `usePermissions()` pour vérifier les permissions
2. **Composants** - `<Can>`, `<Cannot>` pour affichage conditionnel
3. **HOC** - `withPermission()` pour protéger les pages
4. **Context** - Stockage global des permissions utilisateur

---

## 1. API Endpoints

### 1.1 Récupérer toutes les permissions de l'utilisateur

```http
GET /api/auth/permissions
Authorization: Bearer {token}
X-Tenant-ID: 1
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      "users.view",
      "users.edit",
      "users.delete",
      "settings.view"
    ],
    "roles": ["admin", "manager"],
    "is_superadmin": false,
    "is_admin": true
  }
}
```

### 1.2 Vérifier une permission spécifique

```http
POST /api/auth/permissions/check
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "permissions": "users.edit"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "has_permission": true,
    "checked_permissions": ["users.edit"],
    "logic": "OR"
  }
}
```

### 1.3 Vérifier plusieurs permissions (AND logic)

```http
POST /api/auth/permissions/check
Content-Type: application/json

{
  "permissions": ["users.edit", "users.delete"],
  "require_all": true
}
```

### 1.4 Batch check (vérifier plusieurs permissions en une requête)

```http
POST /api/auth/permissions/batch-check
Content-Type: application/json

{
  "checks": [
    {
      "name": "can_edit_users",
      "permissions": ["users.edit"]
    },
    {
      "name": "can_delete_users",
      "permissions": ["users.delete"]
    },
    {
      "name": "can_manage_users",
      "permissions": ["users.edit", "users.delete"],
      "require_all": true
    }
  ]
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "can_edit_users": true,
    "can_delete_users": false,
    "can_manage_users": false
  }
}
```

---

## 2. Utilisation Backend (Laravel)

### 2.1 Dans les Contrôleurs

```php
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function edit(Request $request, $id)
    {
        $user = $request->user();

        // Vérification simple
        if (!$user->hasPermission('users.edit')) {
            return response()->json([
                'success' => false,
                'message' => 'Permission denied'
            ], 403);
        }

        // Vérification multiple (OR logic) - Style Symfony 1
        if ($user->hasPermission([['superadmin', 'admin', 'users.edit']])) {
            // Autorisé
        }

        // Vérification multiple (AND logic)
        if ($user->hasAllPermissions(['users.view', 'users.edit'])) {
            // Autorisé
        }

        // Utiliser les méthodes de compatibilité Symfony 1
        if ($user->hasCredential([['superadmin', 'admin', 'settings_user_function_user_modify']])) {
            // Autorisé
        }
    }
}
```

### 2.2 Dans les Routes (Middleware)

```php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

// Single permission
Route::get('/users', [UserController::class, 'index'])
    ->middleware(['auth:sanctum', 'tenant', 'permission:users.view']);

// Multiple permissions (OR logic)
Route::get('/users/edit', [UserController::class, 'edit'])
    ->middleware(['auth:sanctum', 'tenant', 'permission:superadmin|admin|users.edit']);

// Multiple permissions (AND logic)
Route::post('/users/delete', [UserController::class, 'delete'])
    ->middleware(['auth:sanctum', 'tenant', 'permission:users.view,users.delete']);
```

### 2.3 Helpers PHP Globaux

```php
// Vérifier une permission
if (hasPermission('users.edit')) {
    // Autorisé
}

// Style Symfony 1
if (hasCredential([['superadmin', 'admin', 'users.edit']])) {
    // Autorisé
}

// Vérifier plusieurs permissions (OR)
if (hasAnyPermission(['users.edit', 'users.delete'])) {
    // Autorisé
}

// Vérifier plusieurs permissions (AND)
if (hasAllPermissions(['users.view', 'users.edit'])) {
    // Autorisé
}

// Vérifier les rôles
if (isSuperadmin()) {
    // Est superadmin
}

if (isAdmin()) {
    // Est admin ou superadmin
}

// Récupérer toutes les permissions
$permissions = userPermissions();
// ['users.view', 'users.edit', ...]
```

---

## 3. Utilisation Frontend (Next.js / React)

### 3.1 Context Provider (à créer dans Next.js)

```typescript
// contexts/PermissionsContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface PermissionsData {
  permissions: string[]
  roles: string[]
  is_superadmin: boolean
  is_admin: boolean
}

interface PermissionsContextType {
  permissions: PermissionsData | null
  loading: boolean
  hasPermission: (permission: string | string[], requireAll?: boolean) => boolean
  hasRole: (role: string) => boolean
  isSuperadmin: () => boolean
  isAdmin: () => boolean
  refetch: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<PermissionsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Tenant-ID': getTenantId(),
        },
      })

      const data = await response.json()

      if (data.success) {
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  const hasPermission = (permission: string | string[], requireAll = false): boolean => {
    if (!permissions) return false
    if (permissions.is_superadmin) return true

    if (Array.isArray(permission)) {
      // Symfony style nested array: [['perm1', 'perm2']] = OR logic
      if (permission.length > 0 && Array.isArray(permission[0])) {
        return permission.some(group =>
          Array.isArray(group) && group.some(p => permissions.permissions.includes(p))
        )
      }

      // Regular array
      if (requireAll) {
        return permission.every(p => permissions.permissions.includes(p))
      } else {
        return permission.some(p => permissions.permissions.includes(p))
      }
    }

    return permissions.permissions.includes(permission)
  }

  const hasRole = (role: string): boolean => {
    if (!permissions) return false
    return permissions.roles.includes(role)
  }

  const isSuperadmin = (): boolean => {
    return permissions?.is_superadmin ?? false
  }

  const isAdmin = (): boolean => {
    return permissions?.is_admin ?? false
  }

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        hasPermission,
        hasRole,
        isSuperadmin,
        isAdmin,
        refetch: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider')
  }
  return context
}
```

### 3.2 Hook usePermissions

```typescript
// hooks/usePermissions.ts (si vous ne voulez pas de Context)
import { useEffect, useState } from 'react'

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/permissions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': '1',
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPermissions(data.data.permissions)
          setRoles(data.data.roles)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const hasPermission = (permission: string | string[]) => {
    if (Array.isArray(permission)) {
      return permission.some(p => permissions.includes(p))
    }
    return permissions.includes(permission)
  }

  return { permissions, roles, hasPermission, isLoading }
}
```

### 3.3 Composant <Can>

```typescript
// components/Can.tsx
import { usePermissions } from '@/contexts/PermissionsContext'

interface CanProps {
  permission: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ permission, requireAll = false, children, fallback = null }: CanProps) {
  const { hasPermission, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  if (!hasPermission(permission, requireAll)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage:
// <Can permission="users.edit">
//   <EditButton />
// </Can>

// <Can permission={[['superadmin', 'admin', 'users.edit']]}>
//   <EditButton />
// </Can>
```

### 3.4 HOC withPermission

```typescript
// hocs/withPermission.tsx
import { usePermissions } from '@/contexts/PermissionsContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function withPermission(
  Component: React.ComponentType,
  requiredPermission: string | string[]
) {
  return function ProtectedComponent(props: any) {
    const { hasPermission, loading } = usePermissions()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !hasPermission(requiredPermission)) {
        router.push('/403') // ou '/unauthorized'
      }
    }, [loading, hasPermission, router])

    if (loading) {
      return <div>Loading...</div>
    }

    if (!hasPermission(requiredPermission)) {
      return null
    }

    return <Component {...props} />
  }
}

// Usage:
// export default withPermission(UserEditPage, 'users.edit')
```

### 3.5 Exemples d'utilisation dans Next.js

```typescript
// app/users/page.tsx
'use client'

import { usePermissions } from '@/contexts/PermissionsContext'
import { Can } from '@/components/Can'

export default function UsersPage() {
  const { hasPermission, hasRole, isSuperadmin } = usePermissions()

  return (
    <div>
      <h1>Users</h1>

      {/* Style Symfony 1 compatible */}
      <Can permission={[['superadmin', 'admin', 'users.edit']]}>
        <button>Edit User</button>
      </Can>

      {/* Simple permission */}
      <Can permission="users.delete">
        <button>Delete User</button>
      </Can>

      {/* Multiple permissions (OR) */}
      <Can permission={['users.edit', 'users.delete']}>
        <button>Actions</button>
      </Can>

      {/* Multiple permissions (AND) */}
      <Can permission={['users.view', 'users.edit']} requireAll>
        <button>Edit</button>
      </Can>

      {/* Dans le code */}
      {hasPermission('users.create') && (
        <button>Create User</button>
      )}

      {/* Vérification de rôle */}
      {hasRole('admin') && (
        <div>Admin Panel</div>
      )}

      {/* Superadmin check */}
      {isSuperadmin() && (
        <div>Superadmin Tools</div>
      )}
    </div>
  )
}
```

---

## 4. Exemples Complets

### Exemple 1: Page protégée avec permissions

```typescript
// app/users/edit/[id]/page.tsx
'use client'

import { withPermission } from '@/hocs/withPermission'

function UserEditPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Edit User {params.id}</h1>
      {/* Formulaire d'édition */}
    </div>
  )
}

// Protéger la page - style Symfony 1
export default withPermission(
  UserEditPage,
  [['superadmin', 'admin', 'users.edit']]
)
```

### Exemple 2: Boutons conditionnels

```typescript
// components/UserActions.tsx
'use client'

import { Can } from '@/components/Can'

export function UserActions({ user }: { user: User }) {
  return (
    <div className="flex gap-2">
      <Can permission="users.view">
        <button onClick={() => viewUser(user.id)}>View</button>
      </Can>

      <Can permission={[['superadmin', 'admin', 'users.edit']]}>
        <button onClick={() => editUser(user.id)}>Edit</button>
      </Can>

      <Can permission="users.delete">
        <button onClick={() => deleteUser(user.id)}>Delete</button>
      </Can>
    </div>
  )
}
```

### Exemple 3: API Route protection

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Vérifier la permission côté serveur
  const response = await fetch('http://backend/api/auth/permissions/check', {
    method: 'POST',
    headers: {
      'Authorization': request.headers.get('Authorization') || '',
      'X-Tenant-ID': request.headers.get('X-Tenant-ID') || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      permissions: [['superadmin', 'admin', 'users.edit']],
    }),
  })

  const data = await response.json()

  if (!data.data.has_permission) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    )
  }

  // Continuer avec la mise à jour...
}
```

---

## 5. Tests

### Test Backend (PHPUnit)

```php
use Tests\TestCase;
use Modules\User\Entities\User;

class PermissionTest extends TestCase
{
    public function test_user_has_permission()
    {
        $user = User::factory()->create();
        // Assigner des permissions via groups...

        $this->assertTrue($user->hasPermission('users.edit'));
        $this->assertFalse($user->hasPermission('users.delete'));
    }

    public function test_symfony_style_permissions()
    {
        $user = User::factory()->create();

        $this->assertTrue(
            $user->hasCredential([['superadmin', 'admin', 'users.edit']])
        );
    }
}
```

---

## 6. Migration depuis Symfony 1

### Correspondance des méthodes

| Symfony 1 | Laravel (Ce système) |
|-----------|---------------------|
| `$user->hasCredential('perm')` | `$user->hasPermission('perm')` ou `$user->hasCredential('perm')` |
| `$user->hasCredential([['p1', 'p2']])` | `$user->hasPermission([['p1', 'p2']])` |
| `$user->hasCredential(['p1', 'p2'], true)` | `$user->hasAllPermissions(['p1', 'p2'])` |
| `$user->addCredential('perm')` | `$user->givePermissionTo('perm')` |
| `$user->removeCredential('perm')` | `$user->revokePermissionTo('perm')` |
| `$user->clearCredentials()` | `$user->syncPermissions([])` |

---

## 7. Bonnes Pratiques

1. **Toujours vérifier côté serveur** - Ne jamais faire confiance uniquement au frontend
2. **Utiliser le middleware** - Pour protéger les routes API
3. **Cacher les permissions** - Les permissions sont automatiquement cachées par requête
4. **Nommer les permissions clairement** - Ex: `resource.action` (users.edit, posts.delete)
5. **Superadmin a toutes les permissions** - Pas besoin de les assigner manuellement

## 8. Résolution de problèmes

### Les permissions ne s'affichent pas
- Vérifier que les groups sont chargés avec `->with('groups.permissions')`
- Vérifier que la table `t_group_permission` contient des données

### Performance
- Les permissions sont cachées par requête
- Utiliser eager loading: `User::with(['groups.permissions', 'permissions'])`

## 9. Commandes utiles

```bash
# Regenerer l'autoloader après avoir ajouté le trait
composer dump-autoload

# Clear cache
php artisan config:clear
php artisan cache:clear
```