'use client'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Hook Imports
import { useAuth } from '@/modules/UsersGuard/admin/hooks/useAuth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default function AuthGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return <>{isAuthenticated ? children : <AuthRedirect lang={locale} />}</>
}
