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
 * (ADR-016) and loads no third-party scripts (ADR-018). `/admin` gets a strict
 * nonce-based policy from proxy.ts instead. See ADR-013.
 */
const publicCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: https://${supabaseHostname}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHostname} https://vitals.vercel-insights.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
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
  // Partial Prerendering + tag-based invalidation (ADR-002).
  cacheComponents: true,
  // Upgrades the App Shell to a full route once params are known (ADR-017).
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
    // Makes Next.js's built-in Server Action origin check meaningful behind
    // Vercel's proxy.
    serverActions: {
      allowedOrigins: [new URL(siteUrl).host],
    },
  },

  async headers() {
    return [
      {
        // Admin routes get their CSP from proxy.ts; the rest of these headers
        // are harmless there and a duplicate CSP would be over-restrictive, so
        // this matcher excludes /admin.
        source: '/:path((?!admin).*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
