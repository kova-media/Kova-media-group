import type { NextConfig } from 'next'

/**
 * Supabase Storage host, derived from the project URL so there is one source of
 * truth. Falls back to a wildcard subdomain at build time when the variable is
 * absent (e.g. a lint-only CI job that does not deploy).
 */
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Static Content Security Policy for public routes.
 *
 * Deliberately nonce-free: a per-request nonce forces dynamic rendering, which
 * would destroy the static shell that ADR-002 exists to produce. `'unsafe-inline'`
 * is acceptable here only because the public site renders no user-supplied HTML
 * (ADR-016).
 */
const isDev = process.env.NODE_ENV === 'development'

const publicCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://app.cal.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: https://${supabaseHostname} https://app.cal.com https://cal.com`,
  "font-src 'self' data: https://app.cal.com https://cal.com",
  `connect-src 'self' https://${supabaseHostname} https://vitals.vercel-insights.com https://app.cal.com https://cal.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://app.cal.com https://cal.com",
  "frame-ancestors 'none'",
  'frame-src https://cal.com https://*.cal.com https://app.cal.com https://*.app.cal.com',
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: publicCsp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: [new URL(siteUrl).host],
    },
    optimizePackageImports: ['lucide-react', 'motion'],
  },

  async headers() {
    return [
      {
        source: '/:path((?!admin).*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
