import { apiClient, ensureCsrfCookie } from '@/shared/lib/api-client';
import type { LoginCredentials, LoginResponse, User } from '../../types/auth.types';
import type { ApiResponse } from '@/shared/types/api.types';

/**
 * Sanctum SPA mode for the superadmin layer (central DB).
 * Same flow as the admin service — only the storage key differs so admin and
 * superadmin can coexist in the same browser if needed.
 */
class SuperadminAuthService {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        await ensureCsrfCookie();

        const response = await apiClient.post<LoginResponse>(
            '/superadmin/auth/login',
            {
                username: credentials.username,
                password: credentials.password,
                application: credentials.application,
            }
        );

        if (response.data.success && response.data.data.user) {
            localStorage.setItem('superadmin_user', JSON.stringify(response.data.data.user));
        }

        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post('/superadmin/auth/logout');
        } finally {
            localStorage.removeItem('superadmin_user');
        }
    }

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<ApiResponse<{ user: User }>>('/superadmin/auth/me');

        if (response.data.data?.user) {
            localStorage.setItem('superadmin_user', JSON.stringify(response.data.data.user));
        }

        return response.data.data.user;
    }

    getStoredUser(): User | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('superadmin_user');

        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getStoredUser();
    }
}

export const superadminAuthService = new SuperadminAuthService();
