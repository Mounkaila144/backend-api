'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

interface TenantContextType {
    tenantId: string | null;
    domain: string | null;
    setTenantId: (tenantId: string | null) => void;
    setDomain: (domain: string | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenantId, setTenantIdState] = useState<string | null>(null);
    const [domain, setDomainState] = useState<string | null>(null);

    const setTenantId = useCallback((id: string | null) => {
        setTenantIdState(id);
    }, []);

    const setDomain = useCallback((d: string | null) => {
        setDomainState(d);
    }, []);

    // Load tenant data from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedTenantId = localStorage.getItem('tenant_id');
            const storedDomain = localStorage.getItem('tenant_domain');

            if (storedTenantId) setTenantId(storedTenantId);

            if (storedDomain) {
                setDomain(storedDomain);
            } else {
                setDomain(window.location.hostname);
            }
        }
    }, [setTenantId, setDomain]);

    // Persist to localStorage when tenantId or domain changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (tenantId) {
                localStorage.setItem('tenant_id', tenantId);
            } else {
                localStorage.removeItem('tenant_id');
            }
        }
    }, [tenantId]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (domain) {
                localStorage.setItem('tenant_domain', domain);
            } else {
                localStorage.removeItem('tenant_domain');
            }
        }
    }, [domain]);

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        tenantId,
        domain,
        setTenantId,
        setDomain
    }), [tenantId, domain, setTenantId, setDomain]);

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

export const useTenant = () => {
    const context = useContext(TenantContext);

    if (!context) {
        throw new Error('useTenant must be used within TenantProvider');
    }

    
return context;
};
