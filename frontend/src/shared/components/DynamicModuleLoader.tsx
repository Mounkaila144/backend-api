'use client';

import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import { toPascalCase } from "@/shared/utils/menu-route-generator";
import { getComponent } from '@/shared/config/component-registry';

interface DynamicModuleLoaderProps {
    slug: string[];
    context?: 'admin' | 'superadmin';
}

/**
 * DynamicModuleLoader Component
 *
 * Dynamically loads and renders module components based on the URL slug.
 * Supports both PascalCase (direct) and snake_case (converted to PascalCase).
 *
 * Examples with PascalCase (recommended):
 *   Slug: ['CustomersContracts', 'ContractsList1']
 *   → Module: CustomersContracts
 *   → Component: ContractsList1
 *   → Import: @/src/modules/CustomersContracts/admin/components/ContractsList1
 *
 * Examples with snake_case (legacy):
 *   Slug: ['customers_contracts', 'contracts_list1']
 *   → Module: CustomersContracts
 *   → Component: ContractsList1
 *   → Import: @/src/modules/CustomersContracts/admin/components/ContractsList1
 */
export function DynamicModuleLoader({ slug, context = 'admin' }: DynamicModuleLoaderProps) {
    const [Component, setComponent] = useState<ComponentType<any> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadComponent() {
            try {
                setIsLoading(true);
                setError(null);

                // Convert slug to module and component names
                const { moduleName, componentName } = transformSlugToModule(slug, context);

                // Get component from registry
                const LoadedComponent = getComponent(moduleName, componentName, context);

                if (!LoadedComponent) {
                    throw new Error(
                        `Component "${componentName}" not found in module "${moduleName}". Make sure it's registered in component-registry.ts`
                    );
                }

                setComponent(() => LoadedComponent);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load module');
            } finally {
                setIsLoading(false);
            }
        }

        loadComponent();
    }, [slug.join('/'), context]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState error={error} slug={slug} context={context} />;
    }

    if (!Component) {
        return <NotFoundState slug={slug} />;
    }

    return (
        <div style={{ padding: '20px' }}>
            <Component />
        </div>
    );
}

/**
 * Transform slug array to module information
 *
 * Supports both PascalCase (direct) and snake_case (converted):
 * - PascalCase: ['CustomersContracts', 'ContractsList1'] → Direct use
 * - snake_case: ['customers_contracts', 'contracts_list1'] → Converted to PascalCase
 */
function transformSlugToModule(slug: string[], context: string = 'admin') {
    if (slug.length === 0) {
        throw new Error('Invalid slug: empty array');
    }

    // Case 1: Single segment (e.g., ['Dashboard'] or ['dashboard'])
    if (slug.length === 1) {
        // If already PascalCase, use it directly. Otherwise convert from snake_case
        const componentName = isPascalCase(slug[0]) ? slug[0] : toPascalCase(slug[0]);

        
return {
            moduleName: componentName,
            componentName: componentName,
            importPath: `@/modules/${componentName}/${context}/components/${componentName}`,
        };
    }

    // Case 2: Two segments
    // Support both PascalCase (direct) and snake_case (converted)
    const moduleName = isPascalCase(slug[0]) ? slug[0] : toPascalCase(slug[0]);
    const componentName = isPascalCase(slug[1]) ? slug[1] : toPascalCase(slug[1]);

    return {
        moduleName,
        componentName,
        importPath: `@/modules/${moduleName}/${context}/components/${componentName}`,
    };
}

/**
 * Check if a string is in PascalCase format
 * PascalCase starts with uppercase and contains only alphanumeric characters
 */
function isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Loading state component
 */
function LoadingState() {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '16px',
            }}
        >
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }}
            />
            <p style={{ color: '#666', fontSize: '16px', fontWeight: '500' }}>
                Loading module...
            </p>
            <style jsx>{`
                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}

/**
 * Error state component
 */
function ErrorState({ error, slug, context = 'admin' }: { error: string; slug: string[]; context?: string }) {
    const { moduleName, componentName, importPath } = transformSlugToModule(slug, context);

    return (
        <div
            style={{
                padding: '40px',
                maxWidth: '800px',
                margin: '0 auto',
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px 12px 0 0',
                }}
            >
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                    ⚠️ Module Not Found
                </h1>
            </div>

            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    padding: '24px',
                }}
            >
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ color: '#666', fontSize: '16px', marginBottom: '8px' }}>
                        The requested module could not be loaded.
                    </p>
                    <p
                        style={{
                            background: '#fee',
                            border: '1px solid #fcc',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#c33',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                        }}
                    >
                        {error}
                    </p>
                </div>

                <div
                    style={{
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px',
                    }}
                >
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
                        Debugging Information:
                    </h3>
                    <table style={{ width: '100%', fontSize: '14px' }}>
                        <tbody>
                        <tr>
                            <td
                                style={{
                                    padding: '8px',
                                    color: '#666',
                                    fontWeight: '600',
                                    width: '150px',
                                }}
                            >
                                URL Slug:
                            </td>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                                {slug.join(' / ')}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8px', color: '#666', fontWeight: '600' }}>
                                Module Name:
                            </td>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                                {moduleName}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8px', color: '#666', fontWeight: '600' }}>
                                Component Name:
                            </td>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                                {componentName}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8px', color: '#666', fontWeight: '600' }}>
                                Import Path:
                            </td>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                                {importPath}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    style={{
                        background: '#e7f3ff',
                        border: '1px solid #b3d9ff',
                        borderRadius: '8px',
                        padding: '16px',
                    }}
                >
                    <h3
                        style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            color: '#0066cc',
                            fontWeight: '600',
                        }}
                    >
                        💡 How to Fix:
                    </h3>
                    <ol style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
                        <li style={{ marginBottom: '8px' }}>
                            Ensure the component exists at:{' '}
                            <code
                                style={{
                                    background: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                }}
                            >
                                src/modules/{moduleName}/{context}/components/{componentName}.tsx
                            </code>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            Register the component in:{' '}
                            <code
                                style={{
                                    background: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                }}
                            >
                                src/shared/config/component-registry.ts
                            </code>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            Add this line to the registry:{' '}
                            <code
                                style={{
                                    background: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    display: 'block',
                                    marginTop: '4px',
                                }}
                            >
                                {`'${moduleName}:${componentName}': YourComponent`}
                            </code>
                        </li>
                        <li>Check that the file name matches exactly (case-sensitive)</li>
                    </ol>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link
                        href="/admin/dashboard"
                        style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '500',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                        }}
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

/**
 * Not found state component
 */
function NotFoundState({ slug }: { slug: string[] }) {
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔍</div>
            <h1 style={{ fontSize: '32px', marginBottom: '12px', color: '#333' }}>
                Page Not Found
            </h1>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px' }}>
                The page <strong>/{slug.join('/')}</strong> does not exist.
            </p>
        </div>
    );
}

export default DynamicModuleLoader;