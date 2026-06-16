/**
 * Dashboard Module
 *
 * This module provides menu management functionality for the admin panel.
 * It replaces the old MenuManager and MenuRegistry modules with a unified solution.
 *
 * @example
 * ```typescript
 * // Import components
 * import { MenuManager, Sidebar } from '@/modules/Dashboard';
 *
 * // Import hooks
 * import { useMenus, useMenu } from '@/modules/Dashboard';
 *
 * // Import types
 * import type { MenuItem, MenuFormData } from '@/modules/Dashboard';
 * ```
 */

// Admin layer exports
export * from './admin';

// Types
export * from './types';
