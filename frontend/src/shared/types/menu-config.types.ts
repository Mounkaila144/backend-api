/**
 * Menu Configuration Types
 * Used to define menus in configuration files instead of database
 */

export interface MenuIcon {
  type: 'emoji' | 'svg' | 'icon-class' | 'lucide';
  value: string;
}

export interface MenuBadge {
  value: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * User role types
 */
export type UserRole = 'admin' | 'superadmin';

/**
 * Menu configuration interface
 * Use this to define menus in your module's menu.config.ts file
 */
export interface MenuConfig {

  /** Unique identifier for the menu */
  id: string;

  /** Display label (use English text, will be translated automatically) */
  label: string;

  /** Navigation route (e.g., '/admin/dashboard') */
  route?: string;

  /** Menu icon */
  icon?: MenuIcon;

  /** Display order (lower numbers appear first) */
  order: number;

  /** Parent menu ID for nested menus */
  parentId?: string;

  /** Module name (e.g., 'Dashboard', 'UsersGuard') */
  module: string;

  /** Required permission to view this menu (optional) */
  permission?: string;

  /** Allowed user roles for this menu (if not specified, visible to all roles) */
  roles?: UserRole[];

  /** Badge to display on the menu item */
  badge?: MenuBadge;

  /** Whether the menu is visible */
  isVisible?: boolean;

  /** Whether the menu is active */
  isActive?: boolean;

  /** Sub-menus */
  children?: MenuConfig[];
}

/**
 * Module menu configuration
 * Export this from your module's menu.config.ts
 */
export interface ModuleMenuConfig {

  /** Module name */
  module: string;

  /** Menu items for this module */
  menus: MenuConfig[];
}
