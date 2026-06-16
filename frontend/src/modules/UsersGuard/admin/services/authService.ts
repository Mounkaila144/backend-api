import { apiClient, ensureCsrfCookie } from '@/shared/lib/api-client';
import type { LoginCredentials, LoginResponse, User } from '../../types/auth.types';
import type { ApiResponse } from '@/shared/types/api.types';

/**
 * Sanctum SPA mode — auth lives in an httpOnly session cookie set by Laravel.
 * The frontend never sees a token. We just bootstrap CSRF, post credentials,
 * and the session cookie is automatically attached to subsequent requests.
 */
class AdminAuthService {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        // Required before the first authenticated POST: receives XSRF-TOKEN cookie.
        await ensureCsrfCookie();

        const response = await apiClient.post<LoginResponse>(
            '/admin/auth/login',
            {
                username: credentials.username,
                password: credentials.password,
                application: credentials.application,
            }
        );

        if (response.data.success && response.data.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            if (response.data.data.tenant) {
                localStorage.setItem('tenant', JSON.stringify(response.data.data.tenant));
            }
        }

        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post('/admin/auth/logout');
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('tenant');
        }
    }

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<ApiResponse<{ user: User }>>('/admin/auth/me');

        if (response.data.data?.user) {
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }

        return response.data.data.user;
    }

    getStoredUser(): User | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');

        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    /**
     * Heuristic: a stored user implies a recent login. The actual authoritative
     * check is server-side — useAuth verifies via /me on mount.
     */
    isAuthenticated(): boolean {
        return !!this.getStoredUser();
    }
}

export const adminAuthService = new AdminAuthService();
