'use client';

import { useState, useEffect, useMemo } from 'react';

import type { MenuConfig, UserRole } from '@/shared/types/menu-config.types';
import { getAllMenus, getVisibleMenus, getModuleMenus, getMenusByRole } from '@/shared/config/menu-registry';

/**
 * Hook for accessing configuration-based menus
 *
 * This hook provides access to menus defined in module configuration files
 * instead of loading them from the API.
 *
 * @param options - Configuration options
 * @returns Menu state and utilities
 */
export function useConfigMenus(options: {

  /** Only return visible and active menus */
  visibleOnly?: boolean;

  /** Filter by specific module */
  module?: string;

  /** Filter by user role */
  role?: UserRole;
} = {}) {
  const { visibleOnly = true, module, role } = options;

  const [menus, setMenus] = useState<MenuConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate async loading (in case you want to add async logic later)
    const loadMenus = async () => {
      setIsLoading(true);

      try {
        let loadedMenus: MenuConfig[];

        if (module) {
          // Get menus for specific module
          loadedMenus = getModuleMenus(module);
        } else if (role) {
          // Get menus filtered by role
          loadedMenus = getMenusByRole(role);
        } else if (visibleOnly) {
          // Get all visible menus
          loadedMenus = getVisibleMenus();
        } else {
          // Get all menus
          loadedMenus = getAllMenus();
        }

        setMenus(loadedMenus);
      } catch (error) {
        console.error('[useConfigMenus] Error loading menus:', error);
        setMenus([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenus();
  }, [visibleOnly, module, role]);

  /**
   * Check if a menu or its children are active based on current path
   */
  const isMenuActive = (menu: MenuConfig, currentPath: string): boolean => {
    if (menu.route && currentPath.startsWith(menu.route)) {
      return true;
    }

    if (menu.children) {
      return menu.children.some((child) => isMenuActive(child, currentPath));
    }

    return false;
  };

  /**
   * Get active menu based on current path
   */
  const getActiveMenu = (currentPath: string): MenuConfig | undefined => {
    const findActive = (items: MenuConfig[]): MenuConfig | undefined => {
      for (const item of items) {
        if (item.route && currentPath.startsWith(item.route)) {
          return item;
        }

        if (item.children) {
          const activeChild = findActive(item.children);

          if (activeChild) {
            return activeChild;
          }
        }
      }

      return undefined;
    };

    return findActive(menus);
  };

  /**
   * Get breadcrumb trail for a given path
   */
  const getBreadcrumbs = (currentPath: string): MenuConfig[] => {
    const breadcrumbs: MenuConfig[] = [];

    const findPath = (items: MenuConfig[], path: MenuConfig[] = []): boolean => {
      for (const item of items) {
        const newPath = [...path, item];

        if (item.route && currentPath.startsWith(item.route)) {
          breadcrumbs.push(...newPath);
          
return true;
        }

        if (item.children && findPath(item.children, newPath)) {
          return true;
        }
      }

      return false;
    };

    findPath(menus);
    
return breadcrumbs;
  };

  /**
   * Get menus filtered by permission
   */
  const getMenusByPermission = (permission: string): MenuConfig[] => {
    const filterByPermission = (items: MenuConfig[]): MenuConfig[] => {
      return items
        .filter((item) => !item.permission || item.permission === permission)
        .map((item) => ({
          ...item,
          children: item.children
            ? filterByPermission(item.children)
            : undefined,
        }));
    };

    return filterByPermission(menus);
  };

  /**
   * Memoized count of visible menus
   */
  const menuCount = useMemo(() => {
    const countMenus = (items: MenuConfig[]): number => {
      return items.reduce((count, item) => {
        return count + 1 + (item.children ? countMenus(item.children) : 0);
      }, 0);
    };

    return countMenus(menus);
  }, [menus]);

  return {
    /** All loaded menus */
    menus,

    /** Loading state */
    isLoading,

    /** Total count of menus (including children) */
    menuCount,

    /** Check if a menu is active for a given path */
    isMenuActive,

    /** Get the active menu for a given path */
    getActiveMenu,

    /** Get breadcrumb trail for a given path */
    getBreadcrumbs,

    /** Filter menus by permission */
    getMenusByPermission,
  };
}
