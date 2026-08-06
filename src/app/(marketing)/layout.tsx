import { Suspense } from 'react'

import { PreviewBanner } from '@/features/marketing/preview-banner'

/**
 * Public marketing shell.
 *
 * The preview banner reads request state, so it sits inside <Suspense>: the
 * fallback ships in the static shell and the banner streams in. Awaiting it
 * here would stop every public page from prerendering.
 */
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={null}>
        <PreviewBanner />
      </Suspense>
      {children}
    </div>
  )
}
