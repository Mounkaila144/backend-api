import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Minimal CSP: blocks clickjacking, plugin injection, base-href hijacking, form-action hijacking.
  // Does NOT restrict script-src/style-src yet (would break Next.js inline hydration + MUI styles).
  // Tighten with nonce-based CSP when ready.
  {
    key: 'Content-Security-Policy',
    value: [
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : [])
]

const nextConfig: NextConfig = {
  // Required pour le Dockerfile prod (frontend/Dockerfile target=prod).
  // Génère .next/standalone/server.js — image runtime ~150 MB.
  output: 'standalone',
  basePath: process.env.BASEPATH,
  eslint: {
    ignoreDuringBuilds: false
  },
  typescript: {
    ignoreBuildErrors: false
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ]
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/fr/login',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/login',
        permanent: true,
        locale: false
      },
      {
        source: '/:path((?!en|fr|ar|front-pages|favicon\\.ico|api|sanctum|images|next\\.svg|vercel\\.svg).*)',
        destination: '/fr/:path',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
