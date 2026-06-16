'use client'

import { useEffect, useMemo } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/modules/UsersGuard/superadmin/hooks/useAuth'

// Module Components
import { SitesList } from '@/modules/Site'
import {
  ModulesPage,
  ServicesPage,
  S3ConfigPage,
  MeilisearchConfigPage,
  ResendConfigPage
} from '@/modules/SuperAdmin'

/**
 * Route configuration for SuperAdmin
 * Maps URL slugs to their corresponding components
 */
const ROUTES: Record<string, React.ComponentType> = {
  // Sites
  'sites': SitesList,

  // Modules
  'modules': ModulesPage,

  // Services
  'services': ServicesPage,
  'services/s3': S3ConfigPage,
  'services/meilisearch': MeilisearchConfigPage,
  'services/resend': ResendConfigPage
}

/**
 * Loading Component
 */
function LoadingState() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box textAlign="center">
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
          Chargement...
        </Typography>
      </Box>
    </Box>
  )
}

/**
 * 404 Component
 */
function NotFoundState({ slug }: { slug: string }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/superadmin/sites')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="h6" color="text.secondary">
        Page non trouvée
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Redirection vers le dashboard...
      </Typography>
      <Typography variant="caption" color="text.disabled">
        Route: /superadmin/{slug}
      </Typography>
    </Box>
  )
}

/**
 * SuperAdmin Dynamic Router
 * Routes all superadmin pages through a single catch-all
 */
export default function SuperAdminPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Build the route key from slug
  const slugArray = params?.slug as string[] | undefined

  const routeKey = useMemo(() => {
    return slugArray?.join('/') || ''
  }, [slugArray])

  // Get the component for this route
  const Component = ROUTES[routeKey]

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/superadmin/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Loading state
  if (authLoading) {
    return <LoadingState />
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Route not found
  if (!Component) {
    return <NotFoundState slug={routeKey} />
  }

  // Render the component
  return <Component />
}
