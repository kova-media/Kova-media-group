import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { logger } from '@/lib/logger'
import { MarketingSections } from '@/features/marketing/marketing-sections'
import { getDraftPage } from '@/server/content/admin-queries'
import { getPublishedPage } from '@/server/content/queries'
import { safePublishedPageSlugs } from '@/server/content/static-params'

/**
 * CMS-managed pages that have no designed route of their own — the FAQ and the
 * legal pages.
 *
 * Static segments take precedence over this catch-all, so real routes like
 * /contact and /services resolve to their own files (ARCHITECTURE.md §4.1.2).
 *
 * These used to render through a second, older section renderer, which is why
 * they read as a different website: a narrower container, a different type
 * scale, no masthead. They now go through the same `MarketingSections` as every
 * other page, so there is one rendering path and one design system.
 */
export async function generateStaticParams() {
  // "home" is served by the root route, not the catch-all. The exclusion is
  // passed in rather than applied here, so the sentinel fallback survives it —
  // filtering afterwards re-emptied the list once home was the only published
  // page, tripping the "at least one result" constraint.
  const slugs = await safePublishedPageSlugs({ exclude: ['home'] })

  return slugs.map((slug) => ({ slug: [slug] }))
}

async function loadPage(slugSegments: string[]) {
  const slug = slugSegments.join('/')
  const { isEnabled } = await draftMode()

  try {
    // Draft Mode bypasses every 'use cache' scope for this request, so the
    // draft read is always fresh and is never written back to the cache.
    return await (isEnabled ? getDraftPage(slug) : getPublishedPage(slug))
  } catch (error) {
    // These pages exist only in the CMS, so an unreachable database means there
    // is nothing to serve — `notFound()` upstream is the honest answer, and it
    // keeps a build without a database (or an outage mid-deploy) from failing
    // outright. `safePublishedPageSlugs` already degrades the same way; this is
    // the render half of the same guarantee.
    logger.error(`Could not read the CMS page "${slug}"; serving a 404`, { error })
    return null
  }
}

export async function generateMetadata({
  params,
}: PageProps<'/[...slug]'>): Promise<Metadata> {
  const { slug } = await params
  const page = await loadPage(slug)

  // See the case study route: notFound() in metadata is what produces a real
  // 404 on the first, uncached request.
  if (!page) notFound()

  return {
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? undefined,
    robots: page.seo.noIndex ? { index: false, follow: false } : undefined,
  }
}

/**
 * Blocking rather than instant-shell (ADR-017 revisited).
 *
 * Every published slug is prerendered by `generateStaticParams`, so real pages
 * are served as static HTML and lose nothing here. The only URLs that reach a
 * runtime render are ones that do not exist — and with an instant shell those
 * flush a 200 before `notFound()` is ever reached, producing a soft 404 that
 * search engines treat as a thin page. Blocking lets the 404 status be set
 * correctly, which matters more than an instant shell on a URL with no content.
 */
export const instant = false

export default async function CmsPage({ params }: PageProps<'/[...slug]'>) {
  const { slug } = await params
  const page = await loadPage(slug)

  if (!page) notFound()

  return (
    <MarketingSections
      page={{
        slug: page.slug,
        title: page.title,
        seo: {
          title: page.seo.title ?? page.title,
          description: page.seo.description ?? '',
        },
        sections: page.content.sections,
        isDraft: page.isDraft,
        exists: true,
      }}
    />
  )
}
