'use client';

import { useState, useEffect, useCallback } from 'react';

import { useTenant } from '@/shared/lib/tenant-context';
import { menuService } from '../services/menuService';
import type { MenuItem, MenuFormData } from '../../types';

/**
 * Hook to manage menus with CRUD operations
 */
export const useMenus = () => {
  const { tenantId } = useTenant();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [flatMenus, setFlatMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all menus (hierarchical tree from backend)
   */
  const fetchMenus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await menuService.getMenuTree(tenantId || undefined);

      setMenus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menus';

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  /**
   * Fetch flat menus (no hierarchy)
   */
  const fetchFlatMenus = useCallback(async () => {
    try {
      setError(null);
      const data = await menuService.getMenusFlat(tenantId || undefined);

      setFlatMenus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flat menus';

      setError(errorMessage);
    }
  }, [tenantId]);

  /**
   * Create a new menu
   */
  const createMenu = useCallback(
    async (data: MenuFormData): Promise<MenuItem | null> => {
      try {
        setError(null);
        const newMenu = await menuService.createMenu(data, tenantId || undefined);

        await fetchMenus(); // Refresh list
        
return newMenu;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create menu';

        setError(errorMessage);
        
return null;
      }
    },
    [tenantId, fetchMenus]
  );

  /**
   * Update an existing menu
   */
  const updateMenu = useCallback(
    async (id: string, data: Partial<MenuFormData>): Promise<MenuItem | null> => {
      try {
        setError(null);
        const updatedMenu = await menuService.updateMenu(id, data, tenantId || undefined);

        await fetchMenus(); // Refresh list
        
return updatedMenu;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update menu';

        setError(errorMessage);
        
return null;
      }
    },
    [tenantId, fetchMenus]
  );

  /**
   * Delete a menu
   */
  const deleteMenu = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        await menuService.deleteMenu(id, tenantId || undefined);
        await fetchMenus(); // Refresh list
        
return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete menu';

        setError(errorMessage);
        
return false;
      }
    },
    [tenantId, fetchMenus]
  );


  /**
   * Toggle menu visibility
   */
  const toggleVisibility = useCallback(
    async (id: string, currentVisibility: boolean): Promise<boolean> => {
      try {
        setError(null);
        await menuService.toggleVisibility(id, currentVisibility, tenantId || undefined);
        await fetchMenus(); // Refresh list
        
return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to toggle visibility';

        setError(errorMessage);
        
return false;
      }
    },
    [tenantId, fetchMenus]
  );

  /**
   * Toggle menu active state
   */
  const toggleActive = useCallback(
    async (id: string, currentActive: boolean): Promise<boolean> => {
      try {
        setError(null);
        await menuService.toggleActive(id, currentActive, tenantId || undefined);
        await fetchMenus(); // Refresh list
        
return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to toggle active state';

        setError(errorMessage);
        
return false;
      }
    },
    [tenantId, fetchMenus]
  );

  /**
   * Move menu to a different parent
   */
  const moveMenu = useCallback(
    async (id: string, parentId: string | null): Promise<boolean> => {
      try {
        setError(null);
        await menuService.moveMenu(id, parentId, tenantId || undefined);
        await fetchMenus(); // Refresh list
        
return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to move menu';

        setError(errorMessage);
        
return false;
      }
    },
    [tenantId, fetchMenus]
  );


  /**
   * Refresh menus
   */
  const refresh = useCallback(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Initial fetch - Run only once on mount
  useEffect(() => {
    fetchMenus();
    fetchFlatMenus();
  }, []); // Empty dependency array - fetch only on mount

  return {
    menus,
    flatMenus,
    isLoading,
    error,
    createMenu,
    updateMenu,
    deleteMenu,
    toggleVisibility,
    toggleActive,
    moveMenu,
    refresh,
  };
};

/**
 * Hook to get a single menu by ID
 */
export const useMenu = (id: string) => {
  const { tenantId } = useTenant();
  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await menuService.getMenuById(id, tenantId || undefined);

        setMenu(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu';

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMenu();
    }
  }, [id, tenantId]);

  return { menu, isLoading, error };
};
