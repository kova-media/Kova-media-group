import type { Metadata } from 'next'

import { MarketingSections } from '@/features/marketing/marketing-sections'
import { loadMarketingPage } from '@/server/content/marketing-content'

/** Content and section order come from Admin → Pages. */
const SLUG = 'contact'

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadMarketingPage(SLUG)

  return { title: page.seo.title, description: page.seo.description }
}

export default async function Page() {
  const page = await loadMarketingPage(SLUG)

  return <MarketingSections page={page} />
}
