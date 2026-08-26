import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MarketingSections } from '@/features/marketing/marketing-sections'
import { loadMarketingPage } from '@/server/content/marketing-content'

/**
 * The homepage.
 *
 * The composition is a designed narrative and every band is a component nobody
 * can restyle from the admin — but the order of those bands, and every word,
 * figure and link inside them, is CMS content. Editing it is Admin → Pages →
 * Homepage.
 *
 * There is no bundled copy behind this. If the page is not published the route
 * 404s rather than rendering something from code, because a site that keeps
 * showing content the owner removed is worse than one that visibly needs
 * publishing.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage('home')

  if (!page.exists) notFound()

  return {
    // Absolute: the root layout's `%s — Kova Media Group` template would
    // otherwise append the brand to a title that already carries it.
    title: { absolute: page.seo.title },
    description: page.seo.description,
  }
}

export default async function HomePage() {
  const page = await loadMarketingPage('home')

  if (!page.exists) notFound()

  return <MarketingSections page={page} />
}
