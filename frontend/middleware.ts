import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supported locales from template
const locales = ['en', 'fr', 'ar']
const defaultLocale = 'fr'

/**
 * Middleware for multi-tenant admin application
 *
 * Features:
 * - i18n routing ([lang] parameter)
 * - Multi-tenant context detection
 * - Admin/SuperAdmin route handling
 * - Request logging for debugging
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/images/') ||
    pathname.includes('/static/')
  ) {
    return NextResponse.next()
  }

  // Extract locale from pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Redirect to default locale if no locale in path
  if (!pathnameHasLocale && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname}`

    console.log(`[Middleware] Redirecting to ${url.pathname}`)

    return NextResponse.redirect(url)
  }

  // Logging for debugging (can be removed in production)
  const isAdminRoute = pathname.includes('/admin')
  const isSuperAdminRoute = pathname.includes('/superadmin')

  if (isAdminRoute || isSuperAdminRoute) {
    console.log('[Middleware]', {
      path: pathname,
      host: hostname,
      context: isSuperAdminRoute ? 'superadmin' : 'admin'
    })
  }

  // Continue with request
  const response = NextResponse.next()

  // Add custom headers for tenant context (can be used server-side)
  if (isSuperAdminRoute) {
    response.headers.set('X-Context', 'superadmin')
  } else if (isAdminRoute) {
    response.headers.set('X-Context', 'admin')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - images (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
}
