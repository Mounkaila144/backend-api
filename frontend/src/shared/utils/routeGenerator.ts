/**
 * Route Generator Utility
 * Generates frontend routes based on module and name conventions
 */

export interface RouteConfig {
  module?: string;
  name: string;
  menu?: string; // Explicit path from database
}

/**
 * Remove numeric prefixes from menu names
 * Examples:
 *   0000_users_product → users_product
 *   0010_contracts_list1 → contracts_list1
 *   10_meetings → meetings
 */
function removeNumericPrefix(str: string): string {
  if (!str) return '';

  // Remove leading digits and underscore (e.g., "0010_" or "10_")
  return str.replace(/^\d+_/, '');
}

/**
 * Convert snake_case or camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  // First remove numeric prefixes
  const cleaned = removeNumericPrefix(str);

  return cleaned
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
    .replace(/_/g, '-') // snake_case to kebab-case
    .toLowerCase();
}

/**
 * Generate admin route from module and name
 *
 * Priority:
 * 1. If menu (explicit path) is provided → use it
 * 2. If module is provided → /admin/{module}/{name}
 * 3. If only name → /admin/{name}
 *
 * @param config Route configuration
 * @returns Generated route path
 *
 * @example
 * // With explicit path
 * generateAdminRoute({ menu: '/admin/custom' })
 * // → '/admin/custom'
 *
 * // With module and name
 * generateAdminRoute({ module: 'customers_meetings', name: 'meetings_statistics' })
 * // → '/admin/customers-meetings/meetings-statistics'
 *
 * // With name only
 * generateAdminRoute({ name: 'Dashboard' })
 * // → '/admin/dashboard'
 */
export function generateAdminRoute(config: RouteConfig): string {
  const { module, name, menu } = config;

  // Priority 1: Use explicit path if provided
  if (menu && menu.trim()) {
    // Ensure it starts with /admin
    const cleanPath = menu.trim();

    if (cleanPath.startsWith('/admin')) {
      return cleanPath;
    }

    
return `/admin${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  }

  // Priority 2: Generate from module + name
  if (module && module.trim()) {
    const moduleKebab = toKebabCase(module.trim());
    const nameKebab = toKebabCase(name.trim());

    
return `/admin/${moduleKebab}/${nameKebab}`;
  }

  // Priority 3: Generate from name only
  const nameKebab = toKebabCase(name.trim());

  
return `/admin/${nameKebab}`;
}

/**
 * Generate frontend route (public pages)
 */
export function generateFrontendRoute(config: RouteConfig): string {
  const { module, name, menu } = config;

  if (menu && menu.trim()) {
    const cleanPath = menu.trim();

    if (cleanPath.startsWith('/')) {
      return cleanPath;
    }

    
return `/${cleanPath}`;
  }

  if (module && module.trim()) {
    const moduleKebab = toKebabCase(module.trim());
    const nameKebab = toKebabCase(name.trim());

    
return `/${moduleKebab}/${nameKebab}`;
  }

  const nameKebab = toKebabCase(name.trim());

  
return `/${nameKebab}`;
}

/**
 * Generate superadmin route
 */
export function generateSuperadminRoute(config: RouteConfig): string {
  const { module, name, menu } = config;

  if (menu && menu.trim()) {
    const cleanPath = menu.trim();

    if (cleanPath.startsWith('/superadmin')) {
      return cleanPath;
    }

    
return `/superadmin${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  }

  if (module && module.trim()) {
    const moduleKebab = toKebabCase(module.trim());
    const nameKebab = toKebabCase(name.trim());

    
return `/superadmin/${moduleKebab}/${nameKebab}`;
  }

  const nameKebab = toKebabCase(name.trim());

  
return `/superadmin/${nameKebab}`;
}

/**
 * Detect route type and generate appropriate path
 */
export function generateRoute(config: RouteConfig, type: 'admin' | 'frontend' | 'superadmin' = 'admin'): string {
  switch (type) {
    case 'admin':
      return generateAdminRoute(config);
    case 'frontend':
      return generateFrontendRoute(config);
    case 'superadmin':
      return generateSuperadminRoute(config);
    default:
      return generateAdminRoute(config);
  }
}

/**
 * Examples:
 *
 * generateRoute({ module: 'customers_meetings', name: 'meetings_statistics' })
 * → '/admin/customers-meetings/meetings-statistics'
 *
 * generateRoute({ name: 'Dashboard' })
 * → '/admin/dashboard'
 *
 * generateRoute({ menu: '/admin/custom-page', name: 'anything' })
 * → '/admin/custom-page'
 *
 * generateRoute({ module: 'users_guard', name: 'user_list' })
 * → '/admin/users-guard/user-list'
 */
