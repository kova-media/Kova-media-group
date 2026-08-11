import 'server-only'

/**
 * The cache tag vocabulary — the contract between the CMS and the cache
 * (ARCHITECTURE.md §5.1).
 *
 * Never inline a tag string anywhere else. A typo in a tag is invisible: the
 * page simply never updates, and nothing errors.
 *
 * Granularity is the point. Sections reference library entities by id and
 * resolve them through separately tagged functions (ADR-012), so editing one
 * testimonial invalidates that testimonial — not every page that displays it.
 */
export const cacheTags = {
  page: (slug: string) => `page:${slug}`,
  pagesIndex: 'pages:index',

  caseStudy: (slug: string) => `case-study:${slug}`,
  caseStudiesIndex: 'case-studies:index',

  resource: (slug: string) => `resource:${slug}`,
  resourcesIndex: 'resources:index',

  testimonial: (id: string) => `testimonial:${id}`,
  testimonialsIndex: 'testimonials:index',

  media: (id: string) => `media:${id}`,
  mediaIndex: 'media:index',

  partnerLogosIndex: 'partner-logos:index',
  emailExamplesIndex: 'email-examples:index',

  settings: 'settings:global',
} as const

/**
 * Cache lifetimes.
 *
 * Published content uses `max`: it changes only when the admin publishes, and
 * publishing invalidates the tag. Time-based revalidation would be pure churn.
 */
export const cacheProfiles = {
  content: 'max',
} as const
