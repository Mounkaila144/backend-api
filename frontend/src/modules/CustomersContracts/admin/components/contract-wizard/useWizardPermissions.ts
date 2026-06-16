'use client'

import { useMemo, useCallback } from 'react'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

/**
 * Permission helper for the contract wizard.
 *
 * Matches Symfony 1 credential logic:
 * - "show" credentials: field is visible only if user has the credential
 *   (superadmin always sees → uses hasCredential which bypasses for superadmin)
 * - "remove" credentials: field is hidden if user has the specific credential
 *   (raw check without superadmin bypass, so superadmin sees all fields)
 */
export function useWizardPermissions() {
  const { hasCredential, permissions } = usePermissions()

  // Raw permission set without superadmin bypass
  const rawPermissionSet = useMemo<Set<string>>(
    () => new Set(permissions?.permissions ?? []),
    [permissions]
  )

  /**
   * SHOW credential: field visible if user has the credential.
   * Symfony pattern: ['superadmin', 'credential']
   * Superadmin sees all fields (hasCredential returns true for superadmin).
   */
  const canShow = useCallback(
    (credential: string) => hasCredential(credential),
    [hasCredential]
  )

  /**
   * SHOW credential for admin-level fields.
   * Symfony pattern: ['superadmin', 'admin', 'credential']
   * Field visible if user is superadmin OR admin OR has the specific credential.
   */
  const canShowForAdmin = useCallback(
    (credential: string) => hasCredential(credential) || (permissions?.is_admin ?? false),
    [hasCredential, permissions]
  )

  /**
   * REMOVE credential: field hidden if user has the specific raw permission.
   * Does NOT use superadmin bypass — superadmin sees all fields unless
   * they explicitly have the remove permission assigned.
   */
  const shouldRemove = useCallback(
    (credential: string) => rawPermissionSet.has(credential),
    [rawPermissionSet]
  )

  return { canShow, canShowForAdmin, shouldRemove }
}
