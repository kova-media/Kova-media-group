import type { Metadata } from 'next'

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
 * The document is read once here and once in `generateMetadata`; both go
 * through the same cached, tag-invalidated query, so a warm cache performs no
 * database work at all.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage('home')

  return {
    // Absolute: the root layout's `%s — Kova Media Group` template would
    // otherwise append the brand to a title that already carries it.
    title: { absolute: page.seo.title },
    description: page.seo.description,
  }
}

export default async function HomePage() {
  const page = await loadMarketingPage('home')

  return <MarketingSections page={page} />
}
