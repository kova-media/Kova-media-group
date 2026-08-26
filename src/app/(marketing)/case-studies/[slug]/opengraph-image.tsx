import { ImageResponse } from 'next/og'

import { getSiteChrome } from '@/server/content/site-chrome'
import { OgShell } from '../../opengraph-image'
import { getCaseStudyDetail } from '@/server/content/site-content'

export const alt = 'Case study share card'
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
  const [study, chrome] = await Promise.all([getCaseStudyDetail(slug), getSiteChrome()])

  if (!study) {
    return new ImageResponse(
      <OgShell brand={chrome.siteName} eyebrow="Case study" title={chrome.siteName} />,
      size,
    )
  }

  const headline = study.results[0]

  return new ImageResponse(
    <OgShell
      brand={chrome.siteName}
      eyebrow={study.category || 'Case study'}
      title={study.brand}
      footer={headline ? `${headline.value} · ${headline.label}` : undefined}
    />,
    size,
  )
}
