/**
 * Menu item icon configuration
 */
export interface MenuIcon {

  /**
   * Icon type
   */
  type: 'svg' | 'emoji' | 'icon-class' | 'lucide';

  /**
   * Icon value (SVG path, emoji character, CSS class, or Lucide icon name)
   */
  value: string;
}

/**
 * Backend menu structure (as returned by Laravel API)
 * Uses nested set model (lb, rb, level) for hierarchy
 */
export interface BackendMenuItem {
  id: number;
  name: string;
  menu: string; // Path/URL
  module: string;
  lb: number; // Left boundary
  rb: number; // Right boundary
  level: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  type: 'SYSTEM' | 'CUSTOM';
  translation: string; // Translated label based on ?lang= parameter
  created_at: string;
  updated_at: string;
}

/**
 * Frontend menu item (transformed from backend)
 */
export interface MenuItem {

  /**
   * Unique identifier
   */
  id: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Route path (e.g., '/admin/dashboard')
   * Generated dynamically from module and name
   */
  path?: string;

  /**
   * Icon configuration
   */
  icon?: MenuIcon;

  /**
   * Display order (lower numbers appear first)
   */
  order: number;

  /**
   * Parent menu ID (for submenus)
   */
  parent_id?: string | null;

  /**
   * Whether this menu is active
   */
  is_active: boolean;

  /**
   * Whether this menu is visible
   */
  is_visible: boolean;

  /**
   * Module that owns this menu (from database, snake_case)
   */
  module?: string;

  /**
   * Menu name (from database, may have numeric prefix)
   */
  name?: string;

  /**
   * Permission required to view this menu
   */
  permission?: string | null;

  /**
   * Children menu items (submenus)
   */
  children?: MenuItem[];

  /**
   * Whether this menu is expanded (for UI state)
   */
  isExpanded?: boolean;

  /**
   * Badge configuration
   */
  badge?: {
    value: string | number;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
  };

  /**
   * Timestamps
   */
  created_at?: string;
  updated_at?: string;
}

/**
 * Menu creation/update payload
 */
export interface MenuFormData {
  label: string;
  path?: string;
  icon?: MenuIcon;
  order: number;
  parent_id?: string | null;
  is_active: boolean;
  is_visible: boolean;
  module?: string;
  permission?: string | null;
}

/**
 * Menu reorder payload
 */
export interface MenuReorderItem {
  id: string;
  order: number;
  parent_id?: string | null;
}

/**
 * Menu hierarchy node
 */
export interface MenuNode extends MenuItem {
  children: MenuNode[];
  level: number;
}

/**
 * Menu state
 */
export interface MenuState {
  menus: MenuItem[];
  isLoading: boolean;
  error: string | null;
}
