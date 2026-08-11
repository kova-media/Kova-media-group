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
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'Kova Media Group — Email & SMS Marketing for Ecommerce',
    template: '%s — Kova Media Group',
  },
  description:
    'Kova Media Group is a specialist Email & SMS marketing agency for direct-to-consumer ecommerce brands. We turn existing customers into recurring revenue with high-performing campaigns, automations, and SMS.',
  keywords: [
    'email marketing agency',
    'SMS marketing',
    'Klaviyo agency',
    'Privy',
    'Postscript',
    'ecommerce retention',
    'DTC email marketing',
    'email automation',
  ],
  authors: [{ name: 'Kova Media Group' }],
  openGraph: {
    title: 'Kova Media Group — Email & SMS Marketing for Ecommerce',
    description:
      'A specialist Email & SMS marketing agency for direct-to-consumer ecommerce brands.',
    url: env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Kova Media Group',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kova Media Group — Email & SMS Marketing for Ecommerce',
    description:
      'A specialist Email & SMS marketing agency for direct-to-consumer ecommerce brands.',
  },
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
