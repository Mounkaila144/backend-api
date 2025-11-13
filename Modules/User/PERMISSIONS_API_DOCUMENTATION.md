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

## 3. Utilisation Frontend (Next.js / React) - SANS REQUÊTES RÉPÉTÉES

### 🎯 Stratégie : Permissions en cache côté client

**Aucune requête supplémentaire** après le login ! Toutes les permissions sont :
1. **Extraites au login** depuis la réponse API
2. **Stockées en mémoire** (React Context)
3. **Persistées** dans localStorage
4. **Rechargées automatiquement** au refresh de la page

### 3.0 Helper: Extraire les permissions depuis la réponse de login

Créez ce fichier pour extraire et formater les permissions :

```typescript
// lib/permissions/extractPermissions.ts

export interface UserPermissions {
  permissions: string[]
  groups: string[]
  is_superadmin: boolean
  is_admin: boolean
  user_id: number
  username: string
}

/**
 * Extrait toutes les permissions depuis la réponse de login
 * Fusionne les permissions des groupes + permissions directes
 *
 * @param loginResponse La réponse complète de /api/auth/login
 * @returns Permissions formatées pour le cache client
 */
export function extractPermissionsFromLogin(loginResponse: any): UserPermissions {
  const user = loginResponse.data.user
  const permissions = new Set<string>()
  const groups = new Set<string>()

  // 1. Extraire les permissions depuis les groupes
  if (user.groups && Array.isArray(user.groups)) {
    user.groups.forEach((group: any) => {
      // Ajouter le nom du groupe
      if (group.name) {
        groups.add(group.name)
      }

      // Ajouter toutes les permissions du groupe
      if (group.permissions && Array.isArray(group.permissions)) {
        group.permissions.forEach((perm: any) => {
          if (perm.name && perm.name.trim() !== '') {
            permissions.add(perm.name)
          }
        })
      }
    })
  }

  // 2. Ajouter les permissions directes de l'utilisateur
  if (user.permissions && Array.isArray(user.permissions)) {
    user.permissions.forEach((perm: any) => {
      if (perm.name && perm.name.trim() !== '') {
        permissions.add(perm.name)
      }
    })
  }

  // 3. Déterminer si superadmin/admin
  const groupsArray = Array.from(groups)
  const is_superadmin = groupsArray.includes('superadmin')
  const is_admin = is_superadmin || groupsArray.includes('admin')

  return {
    permissions: Array.from(permissions),
    groups: groupsArray,
    is_superadmin,
    is_admin,
    user_id: user.id,
    username: user.username,
  }
}

/**
 * Sauvegarde les permissions dans localStorage
 */
export function savePermissionsToStorage(permissions: UserPermissions): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_permissions', JSON.stringify(permissions))
  }
}

/**
 * Récupère les permissions depuis localStorage
 */
export function loadPermissionsFromStorage(): UserPermissions | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user_permissions')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse stored permissions:', e)
        return null
      }
    }
  }
  return null
}

/**
 * Supprime les permissions du localStorage (au logout)
 */
export function clearPermissionsFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_permissions')
  }
}
```

## 3. Utilisation Frontend (Next.js / React)

### 3.1 Context Provider - SANS REQUÊTES RÉPÉTÉES

```typescript
// contexts/PermissionsContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  UserPermissions,
  loadPermissionsFromStorage,
  savePermissionsToStorage,
  clearPermissionsFromStorage
} from '@/lib/permissions/extractPermissions'

interface PermissionsContextType {
  permissions: UserPermissions | null
  loading: boolean
  hasCredential: (credential: string | string[] | string[][], requireAll?: boolean) => boolean
  hasGroup: (group: string) => boolean
  isSuperadmin: () => boolean
  isAdmin: () => boolean
  setPermissions: (permissions: UserPermissions) => void
  clearPermissions: () => void
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissionsState] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  // Au montage du composant, charger depuis localStorage
  useEffect(() => {
    const stored = loadPermissionsFromStorage()
    if (stored) {
      setPermissionsState(stored)
    }
    setLoading(false)
  }, [])

  // Sauvegarder dans localStorage à chaque changement
  const setPermissions = (perms: UserPermissions) => {
    setPermissionsState(perms)
    savePermissionsToStorage(perms)
  }

  // Effacer les permissions (au logout)
  const clearPermissions = () => {
    setPermissionsState(null)
    clearPermissionsFromStorage()
  }

  /**
   * Vérifie si l'utilisateur a un credential (groupe OU permission) - Style Symfony 1
   * Supporte:
   * - String simple: hasCredential('admin')
   * - Array simple (OR): hasCredential(['admin', 'superadmin'])
   * - Array imbriqué Symfony (OR): hasCredential([['admin', 'superadmin']])
   * - AND logic: hasCredential(['perm1', 'perm2'], true)
   */
  const hasCredential = (
    credential: string | string[] | string[][],
    requireAll = false
  ): boolean => {
    if (!permissions) return false
    if (permissions.is_superadmin) return true

    // Helper: vérifier un credential simple (groupe OU permission)
    const checkSingle = (cred: string): boolean => {
      // D'abord vérifier dans les groupes
      if (permissions.groups.includes(cred)) return true
      // Puis dans les permissions
      return permissions.permissions.includes(cred)
    }

    // 1. String simple
    if (typeof credential === 'string') {
      return checkSingle(credential)
    }

    // 2. Array imbriqué Symfony style: [['admin', 'superadmin']] = OR logic
    if (Array.isArray(credential) && credential.length > 0 && Array.isArray(credential[0])) {
      return credential.some(group =>
        Array.isArray(group) && group.some(c => checkSingle(c))
      )
    }

    // 3. Array simple
    if (Array.isArray(credential)) {
      if (requireAll) {
        // AND logic: doit avoir TOUS les credentials
        return credential.every(c => checkSingle(c))
      } else {
        // OR logic: doit avoir AU MOINS UN credential
        return credential.some(c => checkSingle(c))
      }
    }

    return false
  }

  /**
   * Vérifie si l'utilisateur appartient à un groupe
   */
  const hasGroup = (group: string): boolean => {
    if (!permissions) return false
    return permissions.groups.includes(group)
  }

  /**
   * Vérifie si l'utilisateur est superadmin
   */
  const isSuperadmin = (): boolean => {
    return permissions?.is_superadmin ?? false
  }

  /**
   * Vérifie si l'utilisateur est admin (ou superadmin)
   */
  const isAdmin = (): boolean => {
    return permissions?.is_admin ?? false
  }

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        hasCredential,
        hasGroup,
        isSuperadmin,
        isAdmin,
        setPermissions,
        clearPermissions,
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

### 3.2 Utilisation au Login - Extraire et stocker les permissions

Dans votre page/composant de login, après une connexion réussie :

```typescript
// pages/login.tsx ou app/login/page.tsx
'use client'

import { usePermissions } from '@/contexts/PermissionsContext'
import { extractPermissionsFromLogin } from '@/lib/permissions/extractPermissions'

export default function LoginPage() {
  const { setPermissions } = usePermissions()

  const handleLogin = async (username: string, password: string) => {
    try {
      // 1. Appeler votre API de login
      const response = await fetch('http://yourapi.local/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, application: 'admin' }),
      })

      const loginData = await response.json()

      if (loginData.success) {
        // 2. Sauvegarder le token
        localStorage.setItem('auth_token', loginData.data.token)
        localStorage.setItem('tenant_id', loginData.data.tenant.id)

        // 3. Extraire et stocker les permissions (AUCUNE REQUÊTE SUPPLÉMENTAIRE !)
        const permissions = extractPermissionsFromLogin(loginData)
        setPermissions(permissions)

        // 4. Rediriger vers le dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    // Votre formulaire de login...
  )
}
```

### 3.3 Au Logout - Nettoyer les permissions

```typescript
// hooks/useAuth.ts ou composant de logout

import { usePermissions } from '@/contexts/PermissionsContext'

export function useAuth() {
  const { clearPermissions } = usePermissions()

  const logout = () => {
    // 1. Supprimer le token
    localStorage.removeItem('auth_token')
    localStorage.removeItem('tenant_id')

    // 2. Supprimer les permissions
    clearPermissions()

    // 3. Rediriger vers login
    router.push('/login')
  }

  return { logout }
}
```

### 3.4 Composant <Can>

```typescript
// components/Can.tsx
import { usePermissions } from '@/contexts/PermissionsContext'

interface CanProps {
  credential: string | string[] | string[][]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Composant pour affichage conditionnel basé sur les credentials
 * Style Symfony 1 - compatible avec hasCredential()
 *
 * @example
 * // Vérifier un groupe
 * <Can credential="admin">
 *   <AdminPanel />
 * </Can>
 *
 * @example
 * // Vérifier plusieurs credentials (OR) - Style Symfony 1
 * <Can credential={[['admin', 'superadmin', 'users.edit']]}>
 *   <EditButton />
 * </Can>
 *
 * @example
 * // Vérifier plusieurs credentials (AND)
 * <Can credential={['users.view', 'users.edit']} requireAll>
 *   <EditButton />
 * </Can>
 */
export function Can({ credential, requireAll = false, children, fallback = null }: CanProps) {
  const { hasCredential, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  if (!hasCredential(credential, requireAll)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Composant inverse - affiche si l'utilisateur N'A PAS le credential
 */
export function Cannot({ credential, requireAll = false, children, fallback = null }: CanProps) {
  const { hasCredential, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  if (hasCredential(credential, requireAll)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

### 3.5 HOC withCredential (protéger des pages)

```typescript
// hocs/withCredential.tsx
import { usePermissions } from '@/contexts/PermissionsContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * HOC pour protéger une page entière avec credentials - Style Symfony 1
 *
 * @param Component Le composant à protéger
 * @param requiredCredential Le(s) credential(s) requis
 * @param requireAll Si true, tous les credentials sont requis (AND logic)
 *
 * @example
 * // Protéger avec un seul credential
 * export default withCredential(UserEditPage, 'admin')
 *
 * @example
 * // Protéger avec plusieurs credentials (OR) - Style Symfony 1
 * export default withCredential(UserEditPage, [['admin', 'superadmin', 'users.edit']])
 *
 * @example
 * // Protéger avec plusieurs credentials (AND)
 * export default withCredential(UserEditPage, ['users.view', 'users.edit'], true)
 */
export function withCredential(
  Component: React.ComponentType,
  requiredCredential: string | string[] | string[][],
  requireAll = false
) {
  return function ProtectedComponent(props: any) {
    const { hasCredential, loading } = usePermissions()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !hasCredential(requiredCredential, requireAll)) {
        router.push('/403') // ou '/unauthorized'
      }
    }, [loading, hasCredential, router])

    if (loading) {
      return <div>Loading...</div>
    }

    if (!hasCredential(requiredCredential, requireAll)) {
      return null
    }

    return <Component {...props} />
  }
}
```

###  3.6 Exemples d'utilisation dans Next.js - Symfony 1 Style

```typescript
// app/users/page.tsx
'use client'

import { usePermissions } from '@/contexts/PermissionsContext'
import { Can, Cannot } from '@/components/Can'

export default function UsersPage() {
  const { hasCredential, hasGroup, isSuperadmin, isAdmin } = usePermissions()

  return (
    <div>
      <h1>Users Management</h1>

      {/* ✅ Style Symfony 1 - Array imbriqué (OR logic) */}
      <Can credential={[['superadmin', 'admin', 'settings_user_edit']]}>
        <button>Edit User</button>
      </Can>

      {/* ✅ Vérifier un groupe spécifique */}
      <Can credential="1-FIDEALIS">
        <button>FIDEALIS Actions</button>
      </Can>

      {/* ✅ Vérifier une permission */}
      <Can credential="contract_meeting_request_default_value">
        <button>Set Default Value</button>
      </Can>

      {/* ✅ Multiple credentials (OR) - Array simple */}
      <Can credential={['admin', 'users.edit']}>
        <button>Actions</button>
      </Can>

      {/* ✅ Multiple credentials (AND) */}
      <Can credential={['users.view', 'users.edit']} requireAll>
        <button>Edit with View</button>
      </Can>

      {/* ✅ Affichage inverse - si l'utilisateur N'A PAS le credential */}
      <Cannot credential="admin">
        <p>You are not an admin</p>
      </Cannot>

      {/* ✅ Dans le code JavaScript */}
      {hasCredential('users.create') && (
        <button>Create User</button>
      )}

      {/* ✅ Vérifier un groupe directement */}
      {hasGroup('admin') && (
        <div>Admin Panel</div>
      )}

      {/* ✅ Vérifier si superadmin */}
      {isSuperadmin() && (
        <div>Superadmin Tools</div>
      )}

      {/* ✅ Vérifier si admin (ou superadmin) */}
      {isAdmin() && (
        <div>Admin Features</div>
      )}
    </div>
  )
}
```

---

## 4. Exemples Complets

### Exemple 1: Page protégée avec credentials - Symfony 1 style

```typescript
// app/users/edit/[id]/page.tsx
'use client'

import { withCredential } from '@/hocs/withCredential'

function UserEditPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Edit User {params.id}</h1>
      {/* Formulaire d'édition */}
    </div>
  )
}

// ✅ Protéger la page - style Symfony 1 (OR logic)
export default withCredential(
  UserEditPage,
  [['superadmin', 'admin', 'settings_user_edit']]
)

// OU avec un seul credential
// export default withCredential(UserEditPage, 'admin')

// OU avec AND logic
// export default withCredential(UserEditPage, ['users.view', 'users.edit'], true)
```

### Exemple 2: Boutons conditionnels - Symfony 1 style

```typescript
// components/UserActions.tsx
'use client'

import { Can } from '@/components/Can'

export function UserActions({ user }: { user: User }) {
  return (
    <div className="flex gap-2">
      {/* ✅ Vérifier une permission */}
      <Can credential="settings_user_view">
        <button onClick={() => viewUser(user.id)}>View</button>
      </Can>

      {/* ✅ Style Symfony 1 - OR logic */}
      <Can credential={[['superadmin', 'admin', 'settings_user_edit']]}>
        <button onClick={() => editUser(user.id)}>Edit</button>
      </Can>

      {/* ✅ Vérifier un groupe */}
      <Can credential="1-FIDEALIS">
        <button onClick={() => exportData(user.id)}>Export Fidealis</button>
      </Can>

      {/* ✅ Vérifier une permission de suppression */}
      <Can credential="settings_user_delete">
        <button onClick={() => deleteUser(user.id)}>Delete</button>
      </Can>
    </div>
  )
}
```

### Exemple 3: Configuration initiale App Layout

```typescript
// app/layout.tsx
import { PermissionsProvider } from '@/contexts/PermissionsContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* ✅ Wrapper toute l'app avec le PermissionsProvider */}
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </body>
    </html>
  )
}
```

### Exemple 4: Flux complet Login → Utilisation

```typescript
// 1. Page de login
// app/login/page.tsx
'use client'

import { usePermissions } from '@/contexts/PermissionsContext'
import { extractPermissionsFromLogin } from '@/lib/permissions/extractPermissions'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { setPermissions } = usePermissions()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // ✅ Appel API de login
      const response = await fetch('http://yourapi.local/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'password',
          application: 'admin'
        }),
      })

      const loginData = await response.json()

      if (loginData.success) {
        // ✅ Sauvegarder token et tenant
        localStorage.setItem('auth_token', loginData.data.token)
        localStorage.setItem('tenant_id', loginData.data.tenant.id)

        // ✅ Extraire et sauvegarder les permissions (AUCUNE REQUÊTE SUPPLÉMENTAIRE)
        const permissions = extractPermissionsFromLogin(loginData)
        setPermissions(permissions)

        console.log('Permissions extraites:', {
          total_permissions: permissions.permissions.length,
          groups: permissions.groups,
          is_admin: permissions.is_admin,
        })

        // ✅ Rediriger
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* Votre formulaire */}
    </form>
  )
}

// 2. Page Dashboard
// app/dashboard/page.tsx
'use client'

import { usePermissions } from '@/contexts/PermissionsContext'
import { Can } from '@/components/Can'

export default function DashboardPage() {
  const { permissions, hasCredential, hasGroup } = usePermissions()

  return (
    <div>
      <h1>Dashboard</h1>

      {/* ✅ Afficher les infos */}
      <p>Username: {permissions?.username}</p>
      <p>Groups: {permissions?.groups.join(', ')}</p>
      <p>Total permissions: {permissions?.permissions.length}</p>

      {/* ✅ Affichage conditionnel - Symfony 1 style */}
      <Can credential={[['superadmin', 'admin', 'settings_user_list']]}>
        <button onClick={() => router.push('/users')}>
          Manage Users
        </button>
      </Can>

      <Can credential="1-FIDEALIS">
        <div>FIDEALIS Features</div>
      </Can>

      {/* ✅ Dans le code */}
      {hasCredential('contract_meeting_request_default_value') && (
        <button>Set Default Values</button>
      )}

      {hasGroup('1-ADMINISTRATEUR THEME GES') && (
        <div>Admin GES Panel</div>
      )}
    </div>
  )
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