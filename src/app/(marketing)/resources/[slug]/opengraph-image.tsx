import { ImageResponse } from 'next/og'

import { OgShell } from '../../opengraph-image'
import { getPublishedResource } from '@/server/content/resource-queries'

export const alt = 'Kova Media Group article'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** A share card per article, carrying its category and title. */
export default async function ResourceOgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const resource = await getPublishedResource(slug)

  if (!resource) {
    return new ImageResponse(
      <OgShell eyebrow="Resources" title="Kova Media Group" />,
      size,
    )
  }

  return new ImageResponse(
    <OgShell
      eyebrow={resource.category}
      title={resource.title}
      footer={resource.readTime}
    />,
    size,
  )
}
