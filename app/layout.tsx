import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SmoothScroll } from '@/components/site/smooth-scroll'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://kovamediagroup.com'),
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
    'Sendlane',
    'ecommerce retention',
    'DTC email marketing',
    'email automation',
  ],
  authors: [{ name: 'Kova Media Group' }],
  openGraph: {
    title: 'Kova Media Group — Email & SMS Marketing for Ecommerce',
    description:
      'A specialist Email & SMS marketing agency for direct-to-consumer ecommerce brands.',
    url: 'https://kovamediagroup.com',
    siteName: 'Kova Media Group',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kova Media Group — Email & SMS Marketing for Ecommerce',
    description:
      'A specialist Email & SMS marketing agency for direct-to-consumer ecommerce brands.',
  },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="min-h-screen font-sans antialiased">
        <SmoothScroll>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </SmoothScroll>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
