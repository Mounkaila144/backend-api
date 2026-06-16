/**
 * Menu Registry
 *
 * This file aggregates all menu configurations from different modules
 * and provides a centralized access point for the application.
 */

import type { MenuConfig, ModuleMenuConfig, UserRole } from '@/shared/types/menu-config.types';

// Import menu configurations from modules
import { dashboardMenuConfig } from '@/modules/Dashboard/menu.config';
import { usersGuardMenuConfig } from '@/modules/Users/menu.config';
import { customersMenuConfig } from '@/modules/Customers/menu.config';
import { CustomersContractsMenuConfig } from '@/modules/CustomersContracts/menu.config';
import { superAdminMenuConfig } from '@/modules/SuperAdmin/menu.config';
import { AppDomoprimeMenuConfig } from '@/modules/AppDomoprime/menu.config';
import { CustomersMeetingsMenuConfig } from '@/modules/CustomersMeetings/menu.config';
import { ConfigurationMenuConfig } from '@/modules/Configuration/menu.config';

/**
 * Registry of all module menu configurations
 *
 * To add a new module's menus:
 * 1. Create a menu.config.ts file in your module directory
 * 2. Import it above
 * 3. Add it to this array
 */
const moduleMenuConfigs: ModuleMenuConfig[] = [
  dashboardMenuConfig,
  usersGuardMenuConfig,
  customersMenuConfig,
  CustomersContractsMenuConfig,
  superAdminMenuConfig,
  AppDomoprimeMenuConfig,
  CustomersMeetingsMenuConfig,
  ConfigurationMenuConfig,

  // Add more module menu configs here
];

/**
 * Flatten menu items including children
 */
function flattenMenus(menus: MenuConfig[]): MenuConfig[] {
  const flattened: MenuConfig[] = [];

  const flatten = (items: MenuConfig[], parentId?: string) => {
    items.forEach((item) => {
      const { children, ...menuWithoutChildren } = item;

      flattened.push({
        ...menuWithoutChildren,
        parentId: parentId || item.parentId,
      });

      if (children && children.length > 0) {
        flatten(children, item.id);
      }
    });
  };

  flatten(menus);
  
return flattened;
}

/**
 * Build hierarchical menu structure from flat menu items
 */
function buildMenuHierarchy(flatMenus: MenuConfig[]): MenuConfig[] {
  const menuMap = new Map<string, MenuConfig>();
  const rootMenus: MenuConfig[] = [];

  // Create a map of all menus
  flatMenus.forEach((menu) => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  // Build hierarchy
  flatMenus.forEach((menu) => {
    const menuItem = menuMap.get(menu.id)!;

    if (menu.parentId) {
      const parent = menuMap.get(menu.parentId);

      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }

        parent.children.push(menuItem);
      } else {
        // Parent not found, treat as root
        rootMenus.push(menuItem);
      }
    } else {
      rootMenus.push(menuItem);
    }
  });

  // Sort menus by order
  const sortMenus = (menus: MenuConfig[]): MenuConfig[] => {
    return menus
      .sort((a, b) => a.order - b.order)
      .map((menu) => ({
        ...menu,
        children: menu.children ? sortMenus(menu.children) : undefined,
      }));
  };

  return sortMenus(rootMenus);
}

/**
 * Get all menus from all modules as a flat array
 */
export function getAllFlatMenus(): MenuConfig[] {
  const allMenus: MenuConfig[] = [];

  moduleMenuConfigs.forEach((moduleConfig) => {
    const flatMenus = flattenMenus(moduleConfig.menus);

    allMenus.push(...flatMenus);
  });

  return allMenus.sort((a, b) => a.order - b.order);
}

/**
 * Get all menus from all modules as a hierarchical structure
 */
export function getAllMenus(): MenuConfig[] {
  const flatMenus = getAllFlatMenus();

  
return buildMenuHierarchy(flatMenus);
}

/**
 * Get menus for a specific module
 */
export function getModuleMenus(moduleName: string): MenuConfig[] {
  const moduleConfig = moduleMenuConfigs.find(
    (config) => config.module === moduleName
  );

  if (!moduleConfig) {
    return [];
  }

  const flatMenus = flattenMenus(moduleConfig.menus);

  
return buildMenuHierarchy(flatMenus);
}

/**
 * Get a specific menu by ID
 */
export function getMenuById(menuId: string): MenuConfig | undefined {
  const allFlatMenus = getAllFlatMenus();

  
return allFlatMenus.find((menu) => menu.id === menuId);
}

/**
 * Get all menus that match a permission
 */
export function getMenusByPermission(permission: string): MenuConfig[] {
  const allFlatMenus = getAllFlatMenus();

  const filteredMenus = allFlatMenus.filter(
    (menu) => menu.permission === permission
  );

  
return buildMenuHierarchy(filteredMenus);
}

/**
 * Filter menus by visibility and active status
 */
export function getVisibleMenus(): MenuConfig[] {
  const allMenus = getAllMenus();

  const filterVisible = (menus: MenuConfig[]): MenuConfig[] => {
    return menus
      .filter((menu) => menu.isVisible !== false && menu.isActive !== false)
      .map((menu) => ({
        ...menu,
        children: menu.children ? filterVisible(menu.children) : undefined,
      }));
  };

  return filterVisible(allMenus);
}

/**
 * Get all registered module names
 */
export function getRegisteredModules(): string[] {
  return moduleMenuConfigs.map((config) => config.module);
}

/**
 * Filter menus by user role
 */
export function getMenusByRole(role: UserRole): MenuConfig[] {
  const allMenus = getAllMenus();

  const filterByRole = (menus: MenuConfig[]): MenuConfig[] => {
    return menus
      .filter((menu) => {
        // If no roles specified, menu is visible to all roles
        if (!menu.roles || menu.roles.length === 0) {
          return true;
        }


        // Check if the menu is accessible by the current role
        return menu.roles.includes(role);
      })
      .map((menu) => ({
        ...menu,
        children: menu.children ? filterByRole(menu.children) : undefined,
      }));
  };

  return filterByRole(allMenus);
}
