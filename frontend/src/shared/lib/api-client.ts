import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import type { ApiError } from '../types/api.types';

// ---------------------------------------------------------------------------
// Sanctum SPA mode
// ---------------------------------------------------------------------------
//
// Auth runs through session cookies set by Laravel:
//   - laravel-session : httpOnly + Secure + SameSite=Lax → never readable by JS
//   - XSRF-TOKEN      : readable by JS, copied into the X-XSRF-TOKEN header on
//                       every non-GET request (Axios does this automatically when
//                       `withXSRFToken` + `withCredentials` are true).
//
// The frontend NEVER stores a Bearer token. tenant_id stays in localStorage as
// a UI hint (the backend re-validates it against the session anyway).
// ---------------------------------------------------------------------------

const isSuperadminContext = (): boolean => {
    if (typeof window === 'undefined') return false;

    return window.location.pathname.includes('/superadmin');
};

const getTenantId = (): string | null => {
    if (typeof window === 'undefined') return null;

    return localStorage.getItem('tenant_id');
};

const getCurrentLocale = (): string => {
    if (typeof window === 'undefined') return 'en';

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const langFromUrl = pathParts[0];

    if (['en', 'fr', 'ar'].includes(langFromUrl)) {
        return langFromUrl;
    }

    const locale = localStorage.getItem('app_language') || 'en';

    return locale.split('_')[0].split('-')[0].toLowerCase();
};

const getLoginUrl = (): string => {
    const locale = getCurrentLocale();

    return `/${locale}/login`;
};

// ---------------------------------------------------------------------------
// Clear local UI state on logout / 401
// ---------------------------------------------------------------------------

const clearAuthData = (): void => {
    if (typeof window === 'undefined') return;

    if (isSuperadminContext()) {
        localStorage.removeItem('superadmin_user');
    } else {
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
    }
    // tenant_id is intentionally preserved so the next login lands on the same tenant.
};

// ---------------------------------------------------------------------------
// CSRF cookie bootstrap (idempotent)
// ---------------------------------------------------------------------------
//
// Sanctum requires GET /sanctum/csrf-cookie before the first authenticated POST
// so the browser stores the XSRF-TOKEN cookie. Subsequent requests include it
// automatically via X-XSRF-TOKEN. We dedupe in-flight requests with a module-level
// promise.

let csrfFetchPromise: Promise<void> | null = null;

export const ensureCsrfCookie = async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    if (csrfFetchPromise) {
        return csrfFetchPromise;
    }

    const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

    // We use /api/csrf-cookie (a Laravel route inside the /api/* group) instead of the
    // default /sanctum/csrf-cookie so the request survives frontend rewrites that match
    // root-level paths (e.g. Next.js locale catch-all). Both endpoints have the same
    // effect: hitting any /api/* route triggers EnsureFrontendRequestsAreStateful → StartSession,
    // which sets the XSRF-TOKEN cookie.
    csrfFetchPromise = axios
        .get(`${baseURL}/csrf-cookie`, { withCredentials: true })
        .then(() => undefined)
        .catch((err) => {
            csrfFetchPromise = null; // allow retry on next call
            throw err;
        });

    return csrfFetchPromise;
};

// ---------------------------------------------------------------------------
// Axios instance factory
// ---------------------------------------------------------------------------

export const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
        // Axios reads XSRF-TOKEN cookie and sets X-XSRF-TOKEN header on every request.
        withXSRFToken: true,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
    });

    // ── Request interceptor ─────────────────────────────────────────────
    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            if (config.headers) {
                if (!isSuperadminContext()) {
                    const tenantId = getTenantId();

                    if (tenantId) {
                        config.headers['X-Tenant-ID'] = tenantId;
                    }
                }

                config.headers['Accept-Language'] = getCurrentLocale();
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // ── Response interceptor — 401 → clear local state and redirect ────
    //
    // No more silent refresh: Sanctum SPA sessions auto-extend on activity, so a 401
    // means the session is genuinely gone (logout, expired, or never authenticated).
    client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError<ApiError>) => {
            if (error.response?.status === 401) {
                clearAuthData();

                if (typeof window !== 'undefined') {
                    const onLoginPage = window.location.pathname.includes('/login');
                    if (!onLoginPage) {
                        window.location.href = getLoginUrl();
                    }
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
};

// ---------------------------------------------------------------------------
// Default singleton
// ---------------------------------------------------------------------------

export const apiClient = createApiClient();
