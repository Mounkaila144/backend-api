/**
 * Users Module
 * Public API exports
 */

// Admin layer exports
export { UsersList } from './admin/components/UsersList';
export { useUsers } from './admin/hooks/useUsers';
export { userService } from './admin/services/userService';

// Type exports
export type { User, UserGroup, UserFilters, PaginationMeta } from './types/user.types';
