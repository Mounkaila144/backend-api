'use client';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import type { AxiosError } from 'axios';

import { superadminAuthService } from '../services/authService';
import type { AuthState, LoginCredentials } from '../../types/auth.types';

interface UseAuthReturn extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    error: string | null;
}

export const useAuth = (): UseAuthReturn => {
    const router = useRouter();

    const [state, setState] = useState<AuthState>({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const [error, setError] = useState<string | null>(null);

    // ── Restore + verify on mount ────────────────────────────────────────
    useEffect(() => {
        const storedUser = superadminAuthService.getStoredUser();

        if (!storedUser) {
            setState({ user: null, tenant: null, isAuthenticated: false, isLoading: false });

            return;
        }

        setState({ user: storedUser, tenant: null, isAuthenticated: true, isLoading: true });

        superadminAuthService
            .getCurrentUser()
            .then((freshUser) => {
                setState({ user: freshUser, tenant: null, isAuthenticated: true, isLoading: false });
            })
            .catch(() => {
                setState({ user: null, tenant: null, isAuthenticated: false, isLoading: false });
            });
    }, []);

    // ── Login ────────────────────────────────────────────────────────────
    const login = useCallback(async (credentials: LoginCredentials) => {
        setError(null);
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await superadminAuthService.login(credentials);

            if (response.success) {
                setState({
                    user: response.data.user,
                    tenant: null,
                    isAuthenticated: true,
                    isLoading: false,
                });

                router.push('/superadmin/dashboard');
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
    }, [router]);

    // ── Logout ───────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        setError(null);

        try {
            await superadminAuthService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setState({
                user: null,
                tenant: null,
                isAuthenticated: false,
                isLoading: false,
            });

            router.push('/superadmin/login');
        }
    }, [router]);

    // ── Refresh user data ────────────────────────────────────────────────
    const refreshUser = useCallback(async () => {
        if (!state.isAuthenticated) return;

        try {
            const user = await superadminAuthService.getCurrentUser();

            setState(prev => ({ ...prev, user }));
        } catch (err) {
            console.error('Failed to refresh user:', err);

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
