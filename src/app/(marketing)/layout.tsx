import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'

import { SmoothScroll } from '@/components/site/smooth-scroll'
import { PreviewBanner } from '@/features/marketing/preview-banner'
import { SiteFooter } from '@/features/marketing/site-footer'
import { SiteHeader } from '@/features/marketing/site-header'

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
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
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

      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />

      {process.env.NODE_ENV === 'production' && <Analytics />}
    </SmoothScroll>
  )
}
