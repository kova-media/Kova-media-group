import 'server-only'

import { logger } from '@/lib/logger'

import { getPublishedCaseStudySlugs, getPublishedPageSlugs } from './queries'

/**
 * Slugs for `generateStaticParams` (ADR-017).
 *
 * The build reads the database to pre-render known URLs. If that read fails —
 * no database in a lint-only CI job, or an outage mid-deploy — we log loudly
 * and fall back rather than failing the build.
 *
 * The degradation is safe *because* of how Cache Components already works: a
 * URL absent from `generateStaticParams` is served the App Shell on first visit
 * and upgraded in the background. Worst case is a slower first visit, not a
 * broken page — far better than a deploy that cannot ship at all.
 *
 * Cache Components additionally requires **at least one** result, so that it can
 * validate the route has no unguarded dynamic access. An empty array is a build
 * error. Hence the sentinel below: it matches no real content, so the route
 * renders its not-found branch and the framework gets its one concrete param.
 *
 * The failure is logged at error level so this cannot quietly mask a
 * misconfigured production build.
 */
const NO_CONTENT_SENTINEL = '__no-published-content__'

export async function safePublishedPageSlugs(): Promise<string[]> {
  try {
    const slugs = await getPublishedPageSlugs()
    return slugs.length > 0 ? slugs : [NO_CONTENT_SENTINEL]
  } catch (error) {
    logger.error(
      'generateStaticParams could not read page slugs; falling back to ISR',
      {
        error,
      },
    )
    return [NO_CONTENT_SENTINEL]
  }
}

export async function safePublishedCaseStudySlugs(): Promise<string[]> {
  try {
    const slugs = await getPublishedCaseStudySlugs()
    return slugs.length > 0 ? slugs : [NO_CONTENT_SENTINEL]
  } catch (error) {
    logger.error(
      'generateStaticParams could not read case study slugs; falling back to ISR',
      { error },
    )
    return [NO_CONTENT_SENTINEL]
  }
}
