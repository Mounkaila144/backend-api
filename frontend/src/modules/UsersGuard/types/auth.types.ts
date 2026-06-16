/**
 * User Types (matching backend response)
 */
export interface User {
  id: number;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  application: 'admin' | 'frontend' | 'superadmin';
  groups?: Group[];
  permissions?: Permission[];
}

/**
 * Group Types
 */
export interface Group {
  id: number;
  name: string;
  permissions?: Permission[];
}

/**
 * Permission Types
 */
export interface Permission {
  id: number;
  name: string;
  slug: string;
}

/**
 * Tenant Types
 */
export interface Tenant {
  id: number;
  host: string;
  database: string;
}

/**
 * Authentication Types
 */
export interface LoginCredentials {
  username: string;
  password: string;
  application: 'admin' | 'frontend';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tenant?: Tenant;
  };
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Superadmin Auth Types
 */
export interface SuperadminLoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}
