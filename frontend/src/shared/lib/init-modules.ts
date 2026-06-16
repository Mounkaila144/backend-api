/**
 * Global module initialization
 * This file initializes all modules
 *
 * Note: Menu management is now handled by the Dashboard module
 * which loads menus from the Laravel backend API
 */

import { initUsersGuardModule } from '@/modules/UsersGuard';

/**
 * Initialize all application modules
 * Call this once at application startup
 */
export const initializeModules = () => {
  // Initialize UsersGuard module
  initUsersGuardModule();

  // Add other module initializations here
  // Example:
  // initProductsModule();
  // initOrdersModule();
  // etc.
};
