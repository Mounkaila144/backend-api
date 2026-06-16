'use client'

import { useMemo, useCallback } from 'react'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

/**
 * Permission helper for the contract edit dialog.
 *
 * Matches Symfony CustomerContractViewForm credential logic:
 * - "canEdit" credentials: field editable if user has the credential
 *   (superadmin sees all via hasCredential bypass)
 * - "shouldHide" credentials: field hidden if user has the raw credential
 *   (no superadmin bypass — superadmin sees all fields)
 */
export function useEditPermissions() {
  const { hasCredential, permissions } = usePermissions()

  const rawPermissionSet = useMemo<Set<string>>(
    () => new Set(permissions?.permissions ?? []),
    [permissions]
  )

  /**
   * EDIT credential: field editable if user has the credential.
   * Superadmin can always edit (hasCredential returns true for superadmin).
   */
  const canEdit = useCallback(
    (credential: string) => hasCredential(credential),
    [hasCredential]
  )

  /**
   * HIDE credential: field hidden if user has the specific raw permission.
   * Does NOT use superadmin bypass — superadmin sees all fields unless
   * they explicitly have the hide permission assigned.
   */
  const shouldHide = useCallback(
    (credential: string) => rawPermissionSet.has(credential),
    [rawPermissionSet]
  )

  return { canEdit, shouldHide }
}
