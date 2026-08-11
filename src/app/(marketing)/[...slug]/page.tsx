import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { PageView } from '@/features/marketing/page-view'
import { getDraftPage } from '@/server/content/admin-queries'
import { getPublishedPage } from '@/server/content/queries'
import { safePublishedPageSlugs } from '@/server/content/static-params'

/**
 * CMS-managed pages (about, privacy, terms, landing pages).
 *
 * Static segments take precedence over this catch-all, so real routes like
 * /contact and /work resolve to their own files (ARCHITECTURE.md §4.1.2).
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

  // Draft Mode bypasses every 'use cache' scope for this request, so the draft
  // read is always fresh and is never written back to the cache.
  return isEnabled ? getDraftPage(slug) : getPublishedPage(slug)
}

export async function generateMetadata({
  params,
}: PageProps<'/[...slug]'>): Promise<Metadata> {
  const { slug } = await params
  const page = await loadPage(slug)

  if (!page) return {}

  return {
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? undefined,
    robots: page.seo.noIndex ? { index: false, follow: false } : undefined,
  }
}

/**
 * `params` is read inside a Suspense boundary so the route still produces an
 * instant, prefetchable shell (ADR-017) — reading it in the page body itself
 * would force the whole route to block on the URL.
 */
export default function CmsPage({ params }: PageProps<'/[...slug]'>) {
  return (
    <Suspense fallback={<div className="pt-32 pb-24 sm:pt-40" aria-hidden />}>
      <CmsPageContent params={params} />
    </Suspense>
  )
}

async function CmsPageContent({
  params,
}: {
  params: PageProps<'/[...slug]'>['params']
}) {
  const { slug } = await params
  const page = await loadPage(slug)

  if (!page) notFound()

  return <PageView page={page} />
}
