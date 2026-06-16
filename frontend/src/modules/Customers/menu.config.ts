import type { ModuleMenuConfig } from '@/shared/types/menu-config.types';

/**
 * Customers Module Menu Configuration
 *
 * This file defines all menu items for the Customers module.
 */
export const customersMenuConfig: ModuleMenuConfig = {
  module: 'Customers',
  menus: [
    {
      id: 'customers',
      label: 'Customers',
      route: '/admin/Customers/Customers',
      icon: {
        type: 'emoji',
        value: '👨‍💼',
      },
      order: 15,
      module: 'Customers',
      roles: ['admin'],
      isVisible: true,
      isActive: true,
    },
  ],
};
