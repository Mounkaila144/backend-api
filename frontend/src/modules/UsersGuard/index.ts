/**
 * UsersGuard Module Barrel Export
 * Exposes public API of the module
 */

// Admin exports
export { default as LoginForm } from './admin/components/LoginForm';
export { useAuth } from './admin/hooks/useAuth';
export { adminAuthService } from './admin/services/authService';
export { initUsersGuardModule } from './admin/init';

// Superadmin exports
export { default as SuperadminLoginForm } from './superadmin/components/LoginForm';
export { useAuth as useSuperadminAuth } from './superadmin/hooks/useAuth';
export { superadminAuthService } from './superadmin/services/authService';
export { initUsersGuardModule as initSuperadminUsersGuardModule } from './superadmin/init';

// Types
export type {
  User,
  Group,
  Permission,
  LoginCredentials,
  LoginResponse,
  AuthState,
} from './types/auth.types';