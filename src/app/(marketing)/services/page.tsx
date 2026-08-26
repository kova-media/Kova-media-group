import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MarketingSections } from '@/features/marketing/marketing-sections'
import { loadMarketingPage } from '@/server/content/marketing-content'

/**
 * Content and section order come from Admin → Pages.
 *
 * Nothing on this page is written in code. If the CMS holds no published
 * document for it, the route 404s rather than substituting bundled copy.
 */
const SLUG = 'services'

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage(SLUG)

  if (!page.exists) notFound()

  return { title: page.seo.title, description: page.seo.description }
}

export default async function Page() {
  const page = await loadMarketingPage(SLUG)

  if (!page.exists) notFound()

  return <MarketingSections page={page} />
}
