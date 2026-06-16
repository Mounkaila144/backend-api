'use client'

/**
 * Can/Cannot Components
 *
 * Conditional rendering components based on permissions
 * Compatible with Symfony 1 hasCredential() behavior
 *
 * @module Can
 */

import { usePermissions } from '@/shared/contexts/PermissionsContext'

interface CanProps {

  /** Credential(s) to check - supports string, array, or nested array (Symfony 1 style) */
  credential: string | string[] | string[][]

  /** If true, all credentials must be present (AND logic). Default: false (OR logic) */
  requireAll?: boolean

  /** Content to display if user has permission */
  children: React.ReactNode

  /** Content to display if user doesn't have permission */
  fallback?: React.ReactNode
}

/**
 * Composant pour affichage conditionnel basé sur les credentials
 * Style Symfony 1 - compatible avec hasCredential()
 *
 * @param credential - Le ou les credentials à vérifier
 * @param requireAll - Si true, tous les credentials sont requis (AND logic)
 * @param children - Contenu à afficher si l'utilisateur a le(s) credential(s)
 * @param fallback - Contenu à afficher si l'utilisateur n'a pas le(s) credential(s)
 *
 * @example
 * ```tsx
 * // Vérifier un groupe
 * <Can credential="admin">
 *   <AdminPanel />
 * </Can>
 *
 * // Vérifier plusieurs credentials (OR) - Style Symfony 1
 * <Can credential={[['admin', 'superadmin', 'users.edit']]}>
 *   <EditButton />
 * </Can>
 *
 * // Vérifier plusieurs credentials (AND)
 * <Can credential={['users.view', 'users.edit']} requireAll>
 *   <EditButton />
 * </Can>
 *
 * // Avec fallback
 * <Can credential="admin" fallback={<p>Access denied</p>}>
 *   <AdminPanel />
 * </Can>
 * ```
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
 *
 * @param credential - Le ou les credentials à vérifier
 * @param requireAll - Si true, tous les credentials doivent être absents (AND logic)
 * @param children - Contenu à afficher si l'utilisateur N'A PAS le(s) credential(s)
 * @param fallback - Contenu à afficher si l'utilisateur a le(s) credential(s)
 *
 * @example
 * ```tsx
 * // Afficher un message si l'utilisateur n'est pas admin
 * <Cannot credential="admin">
 *   <p>You are not an admin</p>
 * </Cannot>
 *
 * // Afficher si l'utilisateur n'a AUCUN des credentials (OR logic)
 * <Cannot credential={[['admin', 'superadmin']]}>
 *   <p>Limited access</p>
 * </Cannot>
 *
 * // Afficher si l'utilisateur n'a pas TOUS les credentials (AND logic)
 * <Cannot credential={['users.view', 'users.edit']} requireAll>
 *   <p>You need both view and edit permissions</p>
 * </Cannot>
 * ```
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
