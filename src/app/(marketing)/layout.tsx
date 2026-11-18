import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { SmoothScroll } from '@/components/site/smooth-scroll'
import { PreviewBanner } from '@/features/marketing/preview-banner'
import { SiteFooter } from '@/features/marketing/site-footer'
import { SiteHeader } from '@/features/marketing/site-header'
import { getSiteChrome } from '@/server/content/site-chrome'

/**
 * Public marketing shell — the v0 chrome.
 *
 * The header is `fixed`, so nothing here reserves space for it; each page owns
 * its own top padding, exactly as in the v0 implementation. Changing that would
 * break the hero compositions, which deliberately run underneath the header.
 *
 * The preview banner reads request state, so it sits inside <Suspense>: the
 * fallback ships in the static shell and the banner streams in. Awaiting it
 * here would stop every public page from prerendering.
 */
/**
 * Site-wide SEO defaults, from Settings.
 *
 * These fields have existed in the admin since the beginning and nothing read
 * them: the owner could edit the default title, description and share image and
 * the site would go on serving values compiled into the root layout. They now
 * apply to every marketing page that does not set its own, which is what the
 * form always implied.
 *
 * Scoped to the marketing group rather than the root, so the admin keeps its
 * own titles and never pays for the query.
 */
export async function generateMetadata(): Promise<Metadata> {
  const chrome = await getSiteChrome()

  return {
    title: { default: chrome.seo.title, template: `%s — ${chrome.siteName}` },
    description: chrome.seo.description,
    openGraph: {
      title: chrome.seo.title,
      description: chrome.seo.description,
      siteName: chrome.siteName,
      type: 'website',
      ...(chrome.seo.image ? { images: [{ url: chrome.seo.image.url }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: chrome.seo.title,
      description: chrome.seo.description,
    },
  }
}

export default async function MarketingLayout({ children }: LayoutProps<'/'>) {
  const chrome = await getSiteChrome()

  return (
    <SmoothScroll>
      <Suspense fallback={null}>
        <PreviewBanner />
      </Suspense>

      {/* First tabbable element on every page. Visually hidden until focused —
          never `display: none`, which would remove it from the tab order. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-foreground focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-background"
      >
        Skip to content
      </a>

      <SiteHeader
        logo={chrome.logo}
        siteName={chrome.siteName}
        navigation={chrome.navigation}
        ctaLabel={chrome.header.ctaLabel}
        ctaHref={chrome.header.ctaHref}
      />
      <main id="main">{children}</main>
      <SiteFooter />

      {process.env.NODE_ENV === 'production' && <Analytics />}
    </SmoothScroll>
  )
}
