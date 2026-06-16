import type { ModuleMenuConfig } from '@/shared/types/menu-config.types'

export const ConfigurationMenuConfig: ModuleMenuConfig = {
  module: 'Configuration',
  menus: [
    {
      id: 'ConfigurationPage',
      label: 'Configuration',
      route: '/admin/Configuration/ConfigurationPage',
      icon: {
        type: 'emoji',
        value: '⚙️',
      },
      order: 90,
      module: 'Configuration',
      roles: ['admin'],
      isVisible: true,
      isActive: true,
    },
  ],
}
