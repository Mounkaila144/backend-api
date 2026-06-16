'use client'

import { useMemo, useCallback } from 'react'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

/**
 * Permission helper for the meeting wizard.
 *
 * Matches Symfony 1 credential logic from CustomerMeetingNewForm.class.php:
 * - canShow: ['superadmin', 'credential'] — superadmin bypass via hasCredential
 * - canShowForAdmin: ['superadmin', 'admin', 'credential'] — admin also bypasses
 * - shouldRemove: raw check without superadmin bypass (superadmin sees all fields)
 */
export function useWizardPermissions() {
  const { hasCredential, permissions } = usePermissions()

  const rawPermissionSet = useMemo<Set<string>>(
    () => new Set(permissions?.permissions ?? []),
    [permissions]
  )

  const canShow = useCallback(
    (credential: string) => hasCredential(credential),
    [hasCredential]
  )

  const canShowForAdmin = useCallback(
    (credential: string) => hasCredential(credential) || (permissions?.is_admin ?? false),
    [hasCredential, permissions]
  )

  const shouldRemove = useCallback(
    (credential: string) => rawPermissionSet.has(credential),
    [rawPermissionSet]
  )

  return { canShow, canShowForAdmin, shouldRemove }
}
