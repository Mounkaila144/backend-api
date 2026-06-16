import type { ModuleMenuConfig } from '@/shared/types/menu-config.types';

export const CustomersMeetingsMenuConfig: ModuleMenuConfig = {
    module: 'CustomersMeetings',
    menus: [
        {
            id: 'MeetingsList',
            label: 'Meeting',
            route: '/admin/CustomersMeetings/MeetingsList',
            icon: {
                type: 'emoji',
                value: '📅',
            },
            order: 21,
            module: 'CustomersMeetings',
            roles: ['admin'],
            isVisible: true,
            isActive: true,
        },
        {
            id: 'MeetingSchedule',
            label: 'Planning',
            route: '/admin/CustomersMeetings/MeetingSchedule',
            icon: {
                type: 'emoji',
                value: '📆',
            },
            order: 22,
            module: 'CustomersMeetings',
            roles: ['admin'],
            isVisible: true,
            isActive: true,
        },
    ],
};
