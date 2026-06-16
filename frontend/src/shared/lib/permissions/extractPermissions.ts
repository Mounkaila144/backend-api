/**
 * Permissions Extraction Utilities
 *
 * Extracts and formats permissions from Laravel API login response
 * Compatible with Symfony 1 hasCredential() behavior
 *
 * @module extractPermissions
 */

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
 * @param loginResponse La réponse complète de /api/admin/auth/login
 * @returns Permissions formatées pour le cache client
 *
 * @example
 * ```typescript
 * const loginData = await authService.login(tenantId, username, password)
 * const permissions = extractPermissionsFromLogin(loginData)
 * // {
 * //   permissions: ["users.edit", "users.view", ...],
 * //   groups: ["admin", "1-FIDEALIS", ...],
 * //   is_superadmin: false,
 * //   is_admin: true,
 * //   user_id: 341,
 * //   username: "admin"
 * // }
 * ```
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
  // Check both group names AND permissions (Symfony stores 'admin'/'superadmin' as permissions, not group names)
  const groupsArray = Array.from(groups)
  const is_superadmin = groupsArray.includes('superadmin') || permissions.has('superadmin')
  const is_admin = is_superadmin || groupsArray.includes('admin') || permissions.has('admin')

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
 *
 * @param permissions Les permissions à sauvegarder
 *
 * @example
 * ```typescript
 * const permissions = extractPermissionsFromLogin(loginData)
 * savePermissionsToStorage(permissions)
 * ```
 */
export function savePermissionsToStorage(permissions: UserPermissions): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_permissions', JSON.stringify(permissions))
  }
}

/**
 * Récupère les permissions depuis localStorage
 *
 * @returns Permissions stockées ou null si non trouvées
 *
 * @example
 * ```typescript
 * const permissions = loadPermissionsFromStorage()
 * if (permissions) {
 *   console.log('Found stored permissions for user:', permissions.username)
 * }
 * ```
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
 *
 * @example
 * ```typescript
 * // Au logout
 * clearPermissionsFromStorage()
 * ```
 */
export function clearPermissionsFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_permissions')
  }
}
