import type { ModuleMenuConfig } from '@/shared/types/menu-config.types';

/**
 * Users Module Menu Configuration
 *
 * This file defines all menu items for the Users (Authentication) module.
 */
export const usersGuardMenuConfig: ModuleMenuConfig = {
  module: 'Users',
  menus: [
    {
      id: 'users',
      label: 'Users',
      route: '/admin/users',
      icon: {
        type: 'emoji',
        value: '👥',
      },
      order: 10,
      module: 'Users',
      roles: ['admin'],
      isVisible: true,
      isActive: true,
    }
  ],
};
