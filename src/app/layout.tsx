import type { Metadata, Viewport } from 'next'

import { env } from '@/env'
import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

/**
 * Root layout. Deliberately minimal: it owns the document shell and fonts only.
 * The marketing and admin route groups bring their own chrome — the public
 * header, footer, and smooth scrolling live in `(marketing)/layout.tsx` so the
 * admin never pays for them.
 */
/**
 * Document-level metadata only.
 *
 * The site's title, description and share image are Settings content and are
 * applied by the marketing layout. What stays here is the part that is not
 * editorial: the base URL every relative metadata URL resolves against.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${fontVariables} bg-background`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  )
}
