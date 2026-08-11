import type { MetadataRoute } from 'next'

import { env } from '@/env'

/**
 * The admin is disallowed for tidiness, not for security — it is behind
 * authentication and returns no-store on every response. A crawler that ignores
 * this file still gets nothing.
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
