import { createApiClient } from '@/shared/lib/api-client';
import { generateAdminRoute } from '@/shared/utils/routeGenerator';
import type { MenuItem, MenuFormData, BackendMenuItem } from '../../types';
import type { ApiResponse } from '@/shared/types/api.types';

/**
 * Menu Service
 * Handles all menu-related API calls for the Dashboard module
 */
class MenuService {
  /**
   * Transform backend menu item to frontend format
   */
  private transformMenuItem(backendItem: BackendMenuItem): MenuItem {
    // Use translation field if available, fallback to name
    const label = backendItem.translation || backendItem.name;

    // Generate path using route generator
    // Priority: explicit menu path > generated from module+name > generated from name only
    const generatedPath = generateAdminRoute({
      module: backendItem.module,
      name: backendItem.name,
      menu: backendItem.menu,
    });

    return {
      id: backendItem.id.toString(),
      label: label,
      path: generatedPath,
      order: backendItem.lb, // Use left boundary as order
      module: backendItem.module || undefined,
      name: backendItem.name || undefined, // Store original name from database
      is_active: backendItem.status === 'ACTIVE',
      is_visible: backendItem.status !== 'DELETED',
      created_at: backendItem.created_at,
      updated_at: backendItem.updated_at,

      // Icon can be added later if needed
      icon: undefined,
      permission: undefined,
      parent_id: null, // Will be determined by nested set structure
      children: [],
    };
  }

  /**
   * Build hierarchy from nested set model (lb, rb, level)
   */
  private buildNestedSetHierarchy(items: BackendMenuItem[]): MenuItem[] {
    // Transform all items first
    const transformed = items.map(item => this.transformMenuItem(item));

    // Sort by left boundary (lb)
    transformed.sort((a, b) => parseInt(a.order.toString()) - parseInt(b.order.toString()));

    // Build hierarchy using level
    const itemsWithLevel = items.map((item, index) => ({
      ...transformed[index],
      level: item.level,
      lb: item.lb,
      rb: item.rb,
    }));

    const root: MenuItem[] = [];
    const stack: Array<MenuItem & { level: number }> = [];

    itemsWithLevel.forEach((item) => {
      // Skip root node (level 0)
      if (item.level === 0) {

return;
      }

      // Remove items from stack that are not ancestors
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      const menuItem: MenuItem = {
        id: item.id,
        label: item.label,
        path: item.path,
        order: item.order,
        module: item.module,
        is_active: item.is_active,
        is_visible: item.is_visible,
        icon: item.icon,
        permission: item.permission,
        parent_id: item.parent_id,
        children: [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      };

      if (stack.length === 0) {
        // Top level item
        root.push(menuItem);
      } else {
        // Child item
        const parent = stack[stack.length - 1];

        if (!parent.children) {
          parent.children = [];
        }

        parent.children.push(menuItem);
      }

      stack.push({ ...menuItem, level: item.level });
    });

    return root;
  }

  /**
   * Get current language from localStorage, browser, or default to 'fr'
   */
  private getCurrentLang(): string {
    if (typeof window !== 'undefined') {
      // Try localStorage first
      const savedLang = localStorage.getItem('app_language');

      if (savedLang) return savedLang;

      // Fallback to browser language
      const browserLang = navigator.language.split('-')[0];

      
return browserLang || 'fr';
    }

    
return 'fr';
  }

  /**
   * Get all menus (paginated list from backend)
   * Note: Backend returns paginated data, we'll get all items
   */
  async getMenus(tenantId?: string): Promise<MenuItem[]> {
    const client = createApiClient(tenantId);
    const lang = this.getCurrentLang();

    const response = await client.get<ApiResponse<{ data: BackendMenuItem[] }>>('/admin/menus', {
      params: {
        per_page: 1000, // Get a large number to simulate "all"
        lang: lang, // Request translated labels
      },
    });


    // Backend returns { data: { data: [...], meta: {...} } }
    const backendItems = response.data.data.data || [];

    
return backendItems.map(item => this.transformMenuItem(item));
  }

  /**
   * Get menu tree (hierarchical structure)
   * This is what we'll use for displaying menus
   */
  async getMenuTree(tenantId?: string): Promise<MenuItem[]> {
    const client = createApiClient(tenantId);
    const lang = this.getCurrentLang();

    const response = await client.get<ApiResponse<BackendMenuItem[]>>('/admin/menus/tree', {
      params: { lang },
    });

    const backendItems = response.data.data || [];
    const hierarchy = this.buildNestedSetHierarchy(backendItems);

    
return hierarchy;
  }

  /**
   * Get flat list of all menus by flattening the tree
   * Used for parent selection in forms
   */
  async getMenusFlat(tenantId?: string): Promise<MenuItem[]> {
    const tree = await this.getMenuTree(tenantId);

    
return this.flattenHierarchy(tree);
  }

  /**
   * Get a single menu by ID
   */
  async getMenuById(id: string, tenantId?: string): Promise<MenuItem> {
    const client = createApiClient(tenantId);
    const response = await client.get<ApiResponse<MenuItem>>(`/admin/menus/${id}`);

    
return response.data.data;
  }

  /**
   * Create a new menu
   */
  async createMenu(data: MenuFormData, tenantId?: string): Promise<MenuItem> {
    const client = createApiClient(tenantId);
    const response = await client.post<ApiResponse<MenuItem>>('/admin/menus', data);

    
return response.data.data;
  }

  /**
   * Update an existing menu
   */
  async updateMenu(id: string, data: Partial<MenuFormData>, tenantId?: string): Promise<MenuItem> {
    const client = createApiClient(tenantId);
    const response = await client.put<ApiResponse<MenuItem>>(`/admin/menus/${id}`, data);

    
return response.data.data;
  }

  /**
   * Delete a menu
   */
  async deleteMenu(id: string, tenantId?: string): Promise<void> {
    const client = createApiClient(tenantId);

    await client.delete(`/admin/menus/${id}`);
  }

  /**
   * Toggle menu visibility (implemented via update)
   */
  async toggleVisibility(id: string, currentVisibility: boolean, tenantId?: string): Promise<MenuItem> {
    return this.updateMenu(id, { is_visible: !currentVisibility }, tenantId);
  }

  /**
   * Toggle menu active state (implemented via update)
   */
  async toggleActive(id: string, currentActive: boolean, tenantId?: string): Promise<MenuItem> {
    return this.updateMenu(id, { is_active: !currentActive }, tenantId);
  }

  /**
   * Move menu to a different parent (uses existing /move route)
   */
  async moveMenu(id: string, parentId: string | null, tenantId?: string): Promise<MenuItem> {
    const client = createApiClient(tenantId);

    const response = await client.post<ApiResponse<MenuItem>>(`/admin/menus/${id}/move`, {
      parent_id: parentId,
    });

    
return response.data.data;
  }

  /**
   * Get children of a specific menu
   */
  async getMenuChildren(id: string, tenantId?: string): Promise<MenuItem[]> {
    const client = createApiClient(tenantId);
    const response = await client.get<ApiResponse<MenuItem[]>>(`/admin/menus/${id}/children`);

    
return response.data.data;
  }

  /**
   * Rebuild menu tree (uses existing /rebuild route)
   */
  async rebuildTree(tenantId?: string): Promise<void> {
    const client = createApiClient(tenantId);

    await client.post('/admin/menus/rebuild');
  }

  /**
   * Get menu by name
   */
  async getMenuByName(name: string, tenantId?: string): Promise<MenuItem> {
    const client = createApiClient(tenantId);
    const response = await client.get<ApiResponse<MenuItem>>(`/admin/menus/by-name/${name}`);

    
return response.data.data;
  }

  /**
   * Hard delete a menu (permanent deletion)
   */
  async hardDeleteMenu(id: string, tenantId?: string): Promise<void> {
    const client = createApiClient(tenantId);

    await client.delete(`/admin/menus/${id}/hard`);
  }

  /**
   * Build menu hierarchy from flat list
   */
  buildHierarchy(menus: MenuItem[]): MenuItem[] {
    const menuMap = new Map<string, MenuItem>();
    const rootMenus: MenuItem[] = [];

    // Create a map and initialize children arrays
    menus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // Build hierarchy
    menus.forEach((menu) => {
      const menuItem = menuMap.get(menu.id)!;

      if (menu.parent_id) {
        const parent = menuMap.get(menu.parent_id);

        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menuItem);
        } else {
          // Parent not found, treat as root
          rootMenus.push(menuItem);
        }
      } else {
        rootMenus.push(menuItem);
      }
    });

    // Sort at each level by order
    const sortMenus = (items: MenuItem[]): MenuItem[] => {
      return items
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          ...item,
          children:
            item.children && item.children.length > 0 ? sortMenus(item.children) : undefined,
        }));
    };

    return sortMenus(rootMenus);
  }

  /**
   * Flatten menu hierarchy to a flat list
   */
  flattenHierarchy(menus: MenuItem[]): MenuItem[] {
    const result: MenuItem[] = [];

    const flatten = (items: MenuItem[], parentId?: string) => {
      items.forEach((item) => {
        const { children, ...itemWithoutChildren } = item;

        result.push({
          ...itemWithoutChildren,
          parent_id: parentId || null,
        });

        if (children && children.length > 0) {
          flatten(children, item.id);
        }
      });
    };

    flatten(menus);
    
return result;
  }
}

export const menuService = new MenuService();
