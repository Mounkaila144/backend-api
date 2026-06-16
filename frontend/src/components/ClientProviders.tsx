'use client'

// Type Imports
import type { ReactNode } from 'react'

// Context Imports from icall26 project
import { TenantProvider } from '@/shared/lib/tenant-context'
import { SidebarProvider } from '@/shared/lib/sidebar-context'
import { PermissionsProvider } from '@/shared/contexts'
import { LanguageProvider } from '@/shared/lib/language-context'
import { TranslationProvider } from '@/shared/i18n/translation-provider'

type Props = {
  children: ReactNode
}

/**
 * Client-side Providers
 *
 * Wraps the application with all client-side contexts from the icall26 project:
 * - LanguageProvider: Language/locale management
 * - TranslationProvider: Translation context (depends on LanguageProvider)
 * - TenantProvider: Multi-tenant support with tenant ID and domain management
 * - PermissionsProvider: User permissions and role-based access control
 * - SidebarProvider: Sidebar collapse/expand state management
 *
 * These providers must be client components and are wrapped inside the server-side Providers
 */
const ClientProviders = (props: Props) => {
  const { children } = props

  return (
    <LanguageProvider>
      <TranslationProvider>
        <TenantProvider>
          <PermissionsProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </PermissionsProvider>
        </TenantProvider>
      </TranslationProvider>
    </LanguageProvider>
  )
}

export default ClientProviders
