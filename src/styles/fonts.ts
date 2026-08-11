import { Geist, Geist_Mono } from 'next/font/google'

/**
 * Self-hosted through next/font — no external requests, no layout shift from a
 * late-arriving webfont, and no third-party origin to allow in the CSP.
 *
 * `display: 'swap'` shows fallback text immediately rather than blocking on the
 * font, which protects LCP.
 *
 * Two families, matching the v0 design system: Geist Sans carries the whole
 * typographic hierarchy, and Geist Mono is used for eyebrows, metrics, and
 * labels where it reads as technical precision rather than decoration.
 */
export const sans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const fontVariables = [sans.variable, mono.variable].join(' ')
