import type { Metadata } from 'next'

import { PageHeader } from '@/components/site/page-header'
import { FinalCta } from '@/features/marketing/sections'
import { ResourceIndex } from '@/features/marketing/resources/resource-index'
import { getResourceList, hasPublishedResources } from '@/server/content/site-content'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Practical guides on email and SMS marketing for ecommerce — automation, deliverability, segmentation, and strategy from Kova Media Group.',
}

export default async function ResourcesPage() {
  const [resources, linkable] = await Promise.all([
    getResourceList(),
    hasPublishedResources(),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Field notes on email & SMS that actually works."
        description="No fluff, no theory for its own sake — practical thinking on the channels we run every day for ecommerce brands."
      />

      <ResourceIndex resources={resources} linkable={linkable} />

      <FinalCta />
    </>
  )
}
