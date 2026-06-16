'use client';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import type { AxiosError } from 'axios';

import { adminAuthService } from '../services/authService';
import type { AuthState, LoginCredentials, Tenant } from '../../types/auth.types';
import { usePermissionsOptional } from '@/shared/contexts/PermissionsContext';
import { extractPermissionsFromLogin } from '@/shared/lib/permissions/extractPermissions';

interface UseAuthReturn extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    error: string | null;
}

/**
 * Sanctum SPA mode — auth lives in an httpOnly session cookie set by Laravel.
 * The hook restores UI state from a stored user object, then verifies the
 * session is still alive by hitting /auth/me. A 401 from any subsequent
 * request triggers an auto-redirect to /login via the api-client interceptor.
 */
export const useAuth = (): UseAuthReturn => {
    const router = useRouter();
    const permissionsContext = usePermissionsOptional();

    const [state, setState] = useState<AuthState>({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const [error, setError] = useState<string | null>(null);

    // ── Restore + verify on mount ────────────────────────────────────────
    useEffect(() => {
        const storedUser = adminAuthService.getStoredUser();
        const tenantStr = localStorage.getItem('tenant');
        let tenant: Tenant | null = null;

        if (tenantStr) {
            try {
                tenant = JSON.parse(tenantStr);
            } catch {
                /* ignore */
            }
        }

        if (!storedUser) {
            setState({ user: null, tenant: null, isAuthenticated: false, isLoading: false });

            return;
        }

        // Optimistic state from localStorage; verify against server.
        setState({ user: storedUser, tenant, isAuthenticated: true, isLoading: true });

        adminAuthService
            .getCurrentUser()
            .then((freshUser) => {
                setState({ user: freshUser, tenant, isAuthenticated: true, isLoading: false });
            })
            .catch(() => {
                // 401 already redirects via api-client interceptor — just clear UI state.
                setState({ user: null, tenant: null, isAuthenticated: false, isLoading: false });
            });
    }, []);

    // ── Login ────────────────────────────────────────────────────────────
    const login = useCallback(async (credentials: LoginCredentials) => {
        setError(null);
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await adminAuthService.login(credentials);

            if (response.success) {
                setState({
                    user: response.data.user,
                    tenant: response.data.tenant ?? null,
                    isAuthenticated: true,
                    isLoading: false,
                });

                if (permissionsContext) {
                    const permissions = extractPermissionsFromLogin(response);

                    permissionsContext.setPermissions(permissions);
                }

                router.push('/admin/users');
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            let errorMessage = 'An error occurred during login';

            if (axiosError.response?.data?.message) {
                errorMessage = axiosError.response.data.message;
            } else if (axiosError.message) {
                errorMessage = axiosError.message;
            }

            setError(errorMessage);
            setState(prev => ({ ...prev, isLoading: false }));
            throw err;
        }
    }, [router, permissionsContext]);

    // ── Logout ───────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        setError(null);

        try {
            await adminAuthService.logout();
        } catch {
            // Logout failed; proceed with local cleanup
        } finally {
            if (permissionsContext) {
                permissionsContext.clearPermissions();
            }

            setState({
                user: null,
                tenant: null,
                isAuthenticated: false,
                isLoading: false,
            });

            const currentPath = window.location.pathname;
            const locale = currentPath.split('/')[1] || 'en';

            router.push(`/${locale}/login`);
        }
    }, [router, permissionsContext]);

    // ── Refresh user data ────────────────────────────────────────────────
    const refreshUser = useCallback(async () => {
        if (!state.isAuthenticated) return;

        try {
            const user = await adminAuthService.getCurrentUser();

            setState(prev => ({ ...prev, user }));
        } catch (err) {
            if ((err as AxiosError).response?.status === 401) {
                await logout();
            }
        }
    }, [state.isAuthenticated, logout]);

    return {
        ...state,
        login,
        logout,
        refreshUser,
        error,
    };
};
