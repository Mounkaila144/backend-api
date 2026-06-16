import type { User, Permission } from '@/modules/UsersGuard';

/**
 * Extract permission slugs from user
 */
export function getUserPermissions(user: User | null): string[] {
  if (!user) return [];

  const permissions: string[] = [];

  // Add user's direct permissions
  if (user.permissions) {
    permissions.push(...user.permissions.map((p: Permission) => p.slug));
  }

  // Add permissions from user's groups
  if (user.groups) {
    user.groups.forEach((group) => {
      if (group.permissions) {
        permissions.push(...group.permissions.map((p) => p.slug));
      }
    });
  }

  // Remove duplicates
  return Array.from(new Set(permissions));
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(user: User | null, permission: string): boolean {
  const userPermissions = getUserPermissions(user);

  
return userPermissions.includes(permission);
}

/**
 * Check if user has all permissions
 */
export function userHasAllPermissions(user: User | null, permissions: string[]): boolean {
  const userPermissions = getUserPermissions(user);

  
return permissions.every((permission) => userPermissions.includes(permission));
}

/**
 * Check if user has any of the permissions
 */
export function userHasAnyPermission(user: User | null, permissions: string[]): boolean {
  const userPermissions = getUserPermissions(user);

  
return permissions.some((permission) => userPermissions.includes(permission));
}
