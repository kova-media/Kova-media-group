import type { Metadata } from 'next'

import { MarketingSections } from '@/features/marketing/marketing-sections'
import { loadMarketingPage } from '@/server/content/marketing-content'

/**
 * The case study index.
 *
 * The page's own copy — masthead, closing CTA — is edited under Admin → Pages →
 * Case studies. The studies it lists are the published rows from Admin → Case
 * studies, in their configured order.
 */
const SLUG = 'case-studies'

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage(SLUG)

  return { title: page.seo.title, description: page.seo.description }
}

export default async function CaseStudiesPage() {
  const page = await loadMarketingPage(SLUG)

  return <MarketingSections page={page} />
}
