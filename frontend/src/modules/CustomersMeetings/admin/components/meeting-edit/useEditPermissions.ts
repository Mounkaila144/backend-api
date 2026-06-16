'use client'

import { useMemo, useCallback } from 'react'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

/**
 * Permission helper for the meeting edit dialog.
 *
 * Maps Symfony CustomerMeetingViewForm credential logic:
 * - canEdit: ['superadmin', 'admin', 'credential'] — superadmin + admin bypass
 * - canEditSuper: ['superadmin', 'credential'] — only superadmin bypass
 * - shouldHide: raw check, no superadmin bypass (superadmin sees all)
 */
export function useEditPermissions() {
  const { hasCredential, permissions } = usePermissions()

  const rawPermissionSet = useMemo<Set<string>>(
    () => new Set(permissions?.permissions ?? []),
    [permissions]
  )

  const isAdmin = permissions?.is_admin ?? false

  /** Field editable if user has credential (with admin bypass). */
  const canEdit = useCallback(
    (credential: string) => hasCredential(credential) || isAdmin,
    [hasCredential, isAdmin]
  )

  /** Field editable only with superadmin bypass (no admin bypass). */
  const canEditSuper = useCallback(
    (credential: string) => hasCredential(credential),
    [hasCredential]
  )

  /** Field hidden if user has the specific raw permission (no bypass). */
  const shouldHide = useCallback(
    (credential: string) => rawPermissionSet.has(credential),
    [rawPermissionSet]
  )

  return { canEdit, canEditSuper, shouldHide }
}
