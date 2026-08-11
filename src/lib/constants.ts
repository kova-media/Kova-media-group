/**
 * Values that more than one layer needs to agree on.
 *
 * Routes live here so a rename is a single edit rather than a grep. Motion
 * timings mirror the CSS tokens in `globals.css` — Framer Motion takes seconds
 * and cannot read a CSS variable, so the two are kept deliberately adjacent and
 * must be changed together.
 */

export const routes = {
  home: '/',
  services: '/services',
  caseStudies: '/case-studies',
  caseStudy: (slug: string) => `/case-studies/${slug}`,
  process: '/process',
  about: '/about',
  faq: '/faq',
  /** Where every primary CTA points. Hosts the scheduler. */
  book: '/book',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
} as const

/** Nav shown when SiteSettings has not been configured yet. */
export const DEFAULT_NAVIGATION = [
  { label: 'Services', href: routes.services },
  { label: 'Case Studies', href: routes.caseStudies },
  { label: 'Process', href: routes.process },
  { label: 'About', href: routes.about },
] as const

/**
 * The scheduler embedded on `/book`. `SiteSettings.bookingUrl` overrides it, so
 * the owner can swap the Calendly link without a deploy.
 *
 * Note this is the *scheduler*, not the CTA target: buttons across the site
 * link to `routes.book`, which hosts this embed.
 */
export const DEFAULT_BOOKING_URL =
  'https://calendly.com/damian-kovamediagroup-7lpe/30min'

/** Seconds, to match Framer Motion. Mirrors --duration-* in globals.css. */
export const duration = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.48,
  deliberate: 0.72,
} as const

/** Mirrors --ease-* in globals.css. */
export const easing = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
} as const
