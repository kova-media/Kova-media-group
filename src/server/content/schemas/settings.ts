import { z } from 'zod'

import { routes } from '@/lib/constants'

/**
 * Site-wide chrome content.
 *
 * The header's call to action and the whole footer are words on every page, so
 * they are content, not code. They live in the two JSON columns on the settings
 * singleton and are validated here on the way in and on the way out — a stored
 * blob that has drifted degrades to the defaults below rather than taking the
 * layout down.
 *
 * What is *not* here: how the header behaves on scroll, how the footer's
 * columns collapse on mobile, the type scale, the hover colours. Those are the
 * design, and the design is code.
 */

const label = (max: number) => z.string().trim().max(max)

/** Same allowlist the section schemas use — nothing but safe schemes. */
const SAFE_HREF = /^(?:\/[^\s]*|https:\/\/[^\s]+|mailto:[^\s]*|tel:[^\s]+|#[^\s]*)$/

export const chromeHrefSchema = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === '' || SAFE_HREF.test(value), {
    message: 'Use a path like /book, or an https:, mailto: or tel: link.',
  })

export const chromeLinkSchema = z.object({
  label: label(60),
  href: chromeHrefSchema,
})

export type ChromeLink = z.infer<typeof chromeLinkSchema>

/* ------------------------------------------------------------------- Header */

export const siteHeaderSchema = z.object({
  ctaLabel: label(40).default(''),
  ctaHref: chromeHrefSchema.default(''),
})

export type SiteHeaderContent = z.infer<typeof siteHeaderSchema>

export const DEFAULT_SITE_HEADER: Required<SiteHeaderContent> = {
  ctaLabel: 'Book a call',
  ctaHref: routes.book,
}

/* ------------------------------------------------------------------- Footer */

export const footerColumnSchema = z.object({
  heading: label(40),
  links: z.array(chromeLinkSchema).max(8).default([]),
})

export type FooterColumn = z.infer<typeof footerColumnSchema>

export const siteFooterSchema = z.object({
  /** The paragraph beneath the logotype. */
  description: z.string().trim().max(400).default(''),
  /** The small mono line at the foot of the page. */
  tagline: label(80).default(''),
  /** The rest of the copyright line, after "© {year} {site name}." */
  note: label(80).default(''),
  /** Link columns are intentionally unbounded so the footer can grow with the site. */
  columns: z.array(footerColumnSchema).default([]),
})

export type SiteFooterContent = z.infer<typeof siteFooterSchema>

/**
 * What the footer shows before Settings has ever been saved.
 *
 * `mailto:` on its own is resolved against the contact email at render time, so
 * changing the contact address in Settings keeps the footer link in step rather
 * than quietly leaving a dead one behind.
 */
export const DEFAULT_SITE_FOOTER: Required<SiteFooterContent> = {
  description:
    'A specialist Email & SMS marketing agency for direct-to-consumer ecommerce brands. We turn the customers you already have into recurring revenue.',
  tagline: 'Email & SMS, done right.',
  note: 'All rights reserved.',
  columns: [
    {
      heading: 'Company',
      links: [
        { label: 'Services', href: routes.services },
        { label: 'Case Studies', href: routes.caseStudies },
        { label: 'Process', href: routes.process },
        { label: 'About', href: routes.about },
      ],
    },
    {
      heading: 'Connect',
      links: [
        { label: 'Email', href: 'mailto:' },
        { label: 'Book a call', href: routes.book },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: routes.privacy },
        { label: 'Terms', href: routes.terms },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ Parsing */

export function parseSiteHeader(value: unknown): Required<SiteHeaderContent> {
  const parsed = siteHeaderSchema.safeParse(value ?? {})
  // A stored blob that no longer validates degrades to the defaults rather than
  // taking every page's header down with it.
  const header = parsed.success ? parsed.data : siteHeaderSchema.parse({})

  return {
    ctaLabel: header.ctaLabel.trim() || DEFAULT_SITE_HEADER.ctaLabel,
    ctaHref: header.ctaHref.trim() || DEFAULT_SITE_HEADER.ctaHref,
  }
}

export function parseSiteFooter(value: unknown): Required<SiteFooterContent> {
  const parsed = siteFooterSchema.safeParse(value ?? {})
  const footer = parsed.success ? parsed.data : siteFooterSchema.parse({})

  return {
    description: footer.description,
    tagline: footer.tagline,
    note: footer.note,
    // An empty column list means "never configured", not "no footer links" —
    // shipping a footer with nothing in it is not a thing anyone chooses.
    columns: footer.columns.length ? footer.columns : DEFAULT_SITE_FOOTER.columns,
  }
}

/** `mailto:` with no address is a stand-in for the configured contact email. */
export function resolveChromeHref(href: string, contactEmail: string): string {
  return href === 'mailto:' ? `mailto:${contactEmail}` : href
}
