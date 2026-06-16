'use client'

/**
 * Permissions Context
 *
 * Provides global permissions state management for the application
 * Compatible with Symfony 1 hasCredential() behavior
 * NO additional API requests after login - all permissions cached locally
 *
 * @module PermissionsContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

import type {
  UserPermissions} from '@/shared/lib/permissions/extractPermissions';
import {
  loadPermissionsFromStorage,
  savePermissionsToStorage,
  clearPermissionsFromStorage
} from '@/shared/lib/permissions/extractPermissions'

interface PermissionsContextType {

  /** Current user permissions or null if not loaded */
  permissions: UserPermissions | null

  /** Loading state during initialization */
  loading: boolean

  /** Check if user has a credential (group OR permission) - Symfony 1 style */
  hasCredential: (credential: string | string[] | string[][], requireAll?: boolean) => boolean

  /** Check if user belongs to a group */
  hasGroup: (group: string) => boolean

  /** Check if user is superadmin */
  isSuperadmin: () => boolean

  /** Check if user is admin (or superadmin) */
  isAdmin: () => boolean

  /** Set permissions (called after login) */
  setPermissions: (permissions: UserPermissions) => void

  /** Clear permissions (called on logout) */
  clearPermissions: () => void
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

/**
 * Permissions Provider Component
 *
 * Wraps the application to provide global permissions state
 * Automatically loads permissions from localStorage on mount
 *
 * @example
 * ```tsx
 * // In app/admin/layout.tsx
 * import { PermissionsProvider } from '@/shared/contexts/PermissionsContext'
 *
 * export default function AdminLayout({ children }) {
 *   return (
 *     <PermissionsProvider>
 *       {children}
 *     </PermissionsProvider>
 *   )
 * }
 * ```
 */
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissionsState] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  // O(1) lookup Sets - rebuilt only when permissions change
  const permissionSet = useMemo<Set<string>>(
    () => new Set(permissions?.permissions ?? []),
    [permissions]
  )

  const groupSet = useMemo<Set<string>>(
    () => new Set(permissions?.groups ?? []),
    [permissions]
  )

  // Au montage du composant, charger depuis localStorage
  useEffect(() => {
    const stored = loadPermissionsFromStorage()

    if (stored) {
      setPermissionsState(stored)
    }

    setLoading(false)
  }, [])

  // Sauvegarder dans localStorage à chaque changement
  const setPermissions = useCallback((perms: UserPermissions) => {
    setPermissionsState(perms)
    savePermissionsToStorage(perms)
  }, [])

  // Effacer les permissions (au logout)
  const clearPermissions = useCallback(() => {
    setPermissionsState(null)
    clearPermissionsFromStorage()
  }, [])

  /**
   * Vérifie si l'utilisateur a un credential (groupe OU permission) - Style Symfony 1
   * Uses Set.has() for O(1) lookups instead of Array.includes() O(n)
   *
   * Supporte plusieurs syntaxes :
   * - String simple: hasCredential('admin')
   * - Array simple (OR): hasCredential(['admin', 'superadmin'])
   * - Array imbriqué Symfony (OR): hasCredential([['admin', 'superadmin']])
   * - AND logic: hasCredential(['perm1', 'perm2'], true)
   */
  const hasCredential = useCallback((
    credential: string | string[] | string[][],
    requireAll = false
  ): boolean => {
    if (!permissions) return false
    if (permissions.is_superadmin) return true

    // O(1) check: group OR permission
    const checkSingle = (cred: string): boolean => {
      return groupSet.has(cred) || permissionSet.has(cred)
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
        return credential.every(c => checkSingle(c))
      } else {
        return credential.some(c => checkSingle(c))
      }
    }

    return false
  }, [permissions, permissionSet, groupSet])

  /**
   * Vérifie si l'utilisateur appartient à un groupe - O(1) lookup
   */
  const hasGroup = useCallback((group: string): boolean => {
    if (!permissions) return false
    
return groupSet.has(group)
  }, [permissions, groupSet])

  /**
   * Vérifie si l'utilisateur est superadmin
   */
  const isSuperadmin = useCallback((): boolean => {
    return permissions?.is_superadmin ?? false
  }, [permissions])

  /**
   * Vérifie si l'utilisateur est admin (ou superadmin)
   */
  const isAdmin = useCallback((): boolean => {
    return permissions?.is_admin ?? false
  }, [permissions])

  const contextValue = useMemo(() => ({
    permissions,
    loading,
    hasCredential,
    hasGroup,
    isSuperadmin,
    isAdmin,
    setPermissions,
    clearPermissions,
  }), [permissions, loading, hasCredential, hasGroup, isSuperadmin, isAdmin, setPermissions, clearPermissions])

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * Hook to access permissions context
 *
 * Must be used within a PermissionsProvider
 *
 * @throws Error if used outside PermissionsProvider
 * @returns Permissions context with all helper functions
 *
 * @example
 * ```typescript
 * import { usePermissions } from '@/shared/contexts/PermissionsContext'
 *
 * function MyComponent() {
 *   const { hasCredential, hasGroup, permissions } = usePermissions()
 *
 *   if (hasCredential('admin')) {
 *     return <AdminPanel />
 *   }
 *
 *   return <UserPanel />
 * }
 * ```
 */
export function usePermissions() {
  const context = useContext(PermissionsContext)

  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider')
  }

  
return context
}

/**
 * Hook to access permissions context (optional)
 *
 * Returns null if used outside PermissionsProvider (does not throw error)
 * Useful for components that may or may not have permissions available
 *
 * @returns Permissions context or null
 *
 * @example
 * ```typescript
 * import { usePermissionsOptional } from '@/shared/contexts/PermissionsContext'
 *
 * function MyComponent() {
 *   const permissions = usePermissionsOptional()
 *
 *   if (!permissions) {
 *     return <div>Loading permissions...</div>
 *   }
 *
 *   return <div>Permissions loaded</div>
 * }
 * ```
 */
export function usePermissionsOptional() {
  return useContext(PermissionsContext)
}
