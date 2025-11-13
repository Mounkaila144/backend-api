# Guide Permissions Next.js - SANS REQUÊTES RÉPÉTÉES

## 🎯 Objectif

Gérer les permissions dans Next.js **sans faire de requêtes répétées** à l'API Laravel.
Toutes les permissions sont extraites au login et stockées en cache local.

## 🚀 Installation Rapide (3 fichiers)

### Fichier 1 : `lib/permissions/extractPermissions.ts`

```typescript
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
 */
export function extractPermissionsFromLogin(loginResponse: any): UserPermissions {
  const user = loginResponse.data.user
  const permissions = new Set<string>()
  const groups = new Set<string>()

  // 1. Extraire les permissions depuis les groupes
  if (user.groups && Array.isArray(user.groups)) {
    user.groups.forEach((group: any) => {
      if (group.name) {
        groups.add(group.name)
      }

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

export function savePermissionsToStorage(permissions: UserPermissions): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_permissions', JSON.stringify(permissions))
  }
}

export function loadPermissionsFromStorage(): UserPermissions | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user_permissions')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        return null
      }
    }
  }
  return null
}

export function clearPermissionsFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_permissions')
  }
}
```

### Fichier 2 : `contexts/PermissionsContext.tsx`

```typescript
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

  // Au montage, charger depuis localStorage
  useEffect(() => {
    const stored = loadPermissionsFromStorage()
    if (stored) {
      setPermissionsState(stored)
    }
    setLoading(false)
  }, [])

  const setPermissions = (perms: UserPermissions) => {
    setPermissionsState(perms)
    savePermissionsToStorage(perms)
  }

  const clearPermissions = () => {
    setPermissionsState(null)
    clearPermissionsFromStorage()
  }

  /**
   * Vérifie si l'utilisateur a un credential (groupe OU permission) - Style Symfony 1
   */
  const hasCredential = (
    credential: string | string[] | string[][],
    requireAll = false
  ): boolean => {
    if (!permissions) return false
    if (permissions.is_superadmin) return true

    const checkSingle = (cred: string): boolean => {
      if (permissions.groups.includes(cred)) return true
      return permissions.permissions.includes(cred)
    }

    if (typeof credential === 'string') {
      return checkSingle(credential)
    }

    // Array imbriqué Symfony style: [['admin', 'superadmin']] = OR logic
    if (Array.isArray(credential) && credential.length > 0 && Array.isArray(credential[0])) {
      return credential.some(group =>
        Array.isArray(group) && group.some(c => checkSingle(c))
      )
    }

    if (Array.isArray(credential)) {
      if (requireAll) {
        return credential.every(c => checkSingle(c))
      } else {
        return credential.some(c => checkSingle(c))
      }
    }

    return false
  }

  const hasGroup = (group: string): boolean => {
    if (!permissions) return false
    return permissions.groups.includes(group)
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

### Fichier 3 : `components/Can.tsx`

```typescript
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
 * Composant inverse
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

## 📦 Configuration

### Étape 1 : Wrapper l'app avec le Provider

```typescript
// app/layout.tsx
import { PermissionsProvider } from '@/contexts/PermissionsContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </body>
    </html>
  )
}
```

### Étape 2 : Utiliser au Login

```typescript
// app/login/page.tsx
'use client'

import { usePermissions } from '@/contexts/PermissionsContext'
import { extractPermissionsFromLogin } from '@/lib/permissions/extractPermissions'

export default function LoginPage() {
  const { setPermissions } = usePermissions()

  const handleLogin = async (username: string, password: string) => {
    const response = await fetch('http://yourapi.local/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, application: 'admin' }),
    })

    const loginData = await response.json()

    if (loginData.success) {
      // Sauvegarder le token
      localStorage.setItem('auth_token', loginData.data.token)
      localStorage.setItem('tenant_id', loginData.data.tenant.id)

      // ✅ Extraire et sauvegarder les permissions (AUCUNE REQUÊTE SUPPLÉMENTAIRE !)
      const permissions = extractPermissionsFromLogin(loginData)
      setPermissions(permissions)

      console.log('Permissions:', {
        total: permissions.permissions.length,
        groups: permissions.groups,
      })

      router.push('/dashboard')
    }
  }

  return <form onSubmit={handleLogin}>{/* ... */}</form>
}
```

### Étape 3 : Au Logout

```typescript
const { clearPermissions } = usePermissions()

const logout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('tenant_id')
  clearPermissions() // ✅ Nettoyer les permissions
  router.push('/login')
}
```

## ✅ Utilisation

### Dans les composants

```tsx
import { Can } from '@/components/Can'

// Style Symfony 1 - OR logic
<Can credential={[['superadmin', 'admin', 'settings_user_edit']]}>
  <button>Edit User</button>
</Can>

// Vérifier un groupe
<Can credential="1-FIDEALIS">
  <div>FIDEALIS Features</div>
</Can>

// Vérifier une permission
<Can credential="contract_meeting_request_default_value">
  <button>Set Default</button>
</Can>

// AND logic
<Can credential={['users.view', 'users.edit']} requireAll>
  <button>Edit</button>
</Can>
```

### Dans le code

```typescript
const { hasCredential, hasGroup, permissions } = usePermissions()

// Vérifier un credential
if (hasCredential('admin')) {
  // faire quelque chose
}

// Vérifier un groupe
if (hasGroup('1-ADMINISTRATEUR THEME GES')) {
  // faire quelque chose
}

// Afficher les infos
console.log('Total permissions:', permissions?.permissions.length)
console.log('Groups:', permissions?.groups)
```

## 🎯 Avantages

✅ **Aucune requête répétée** : Permissions extraites au login uniquement
✅ **Performance maximale** : Vérifications instantanées en mémoire
✅ **Persistance** : Sauvegardées dans localStorage
✅ **Symfony 1 compatible** : Même syntaxe `hasCredential()`
✅ **Type-safe** : Full TypeScript

## 📊 Exemple de données extraites

Depuis votre réponse de login, le système extrait :

```json
{
  "permissions": [
    "contract_meeting_request_default_value",
    "contract_meeting_polluter_not_empty_value",
    "meeting_update_no_cumac_generation",
    "app_domoprime_contract_view_fidealis",
    // ... 1176+ permissions au total
  ],
  "groups": [
    "1-FIDEALIS",
    "1-ADMINISTRATEUR THEME GES",
    "1-5yousign evidence",
    // ... 9 groupes
  ],
  "is_superadmin": false,
  "is_admin": false,
  "user_id": 341,
  "username": "admin"
}
```

**Résultat** : Toutes ces données sont disponibles instantanément, sans requête !
