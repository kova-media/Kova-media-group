import { ImageResponse } from 'next/og'

import { OgShell } from '../../opengraph-image'
import { getCaseStudyDetail } from '@/server/content/site-content'

export const alt = 'Kova Media Group case study'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * A share card per case study, carrying the client name and the headline
 * result — the two things that make the link worth clicking.
 */
export default async function CaseStudyOgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const study = await getCaseStudyDetail(slug)

  if (!study) {
    return new ImageResponse(
      <OgShell eyebrow="Case study" title="Kova Media Group" />,
      size,
    )
  }

  const headline = study.results[0]

  return new ImageResponse(
    <OgShell
      eyebrow={study.category || 'Case study'}
      title={study.brand}
      footer={headline ? `${headline.value} · ${headline.label}` : undefined}
    />,
    size,
  )
}
