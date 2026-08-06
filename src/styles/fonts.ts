import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'

/**
 * Self-hosted through next/font — no external requests, no layout shift from a
 * late-arriving webfont, and no third-party origin to allow in the CSP.
 *
 * `display: 'swap'` shows fallback text immediately rather than blocking on the
 * font, which protects LCP.
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

/** Editorial counterpoint for display type. Used deliberately, never as body copy. */
export const display = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

export const fontVariables = [sans.variable, mono.variable, display.variable].join(' ')
