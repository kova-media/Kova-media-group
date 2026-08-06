import type { Metadata } from 'next'

import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

/**
 * Root layout. Deliberately minimal: it owns the document shell and fonts only.
 * The marketing and admin route groups bring their own chrome.
 */
export const metadata: Metadata = {
  title: {
    default: 'Kova Media Group',
    template: '%s · Kova Media Group',
  },
  description:
    'Email and SMS marketing for DTC brands. Kova becomes an extension of your team.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink-900">{children}</body>
    </html>
  )
}
