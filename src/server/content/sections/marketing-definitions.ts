import { z } from 'zod'

import {
  ctaSchema,
  defineSection,
  hrefSchema,
  mediaRefSchema,
  requiredText,
  textList,
} from './types'

/**
 * The marketing catalogue — one definition per designed band of the public
 * site (CMS.md §3.2).
 *
 * The split this file exists to enforce is the one in CMS.md §1, applied to the
 * pages that were previously hard-coded:
 *
 *   **Code owns** structure, layout, type, colour, spacing, responsive
 *   behaviour and animation. Every one of these sections renders through a
 *   component that a designer wrote and that an editor cannot reach.
 *
 *   **The CMS owns** the words, the figures, the links and the images inside
 *   those components — and the order the bands appear in.
 *
 * So the schemas below are deliberately shaped like the components rather than
 * like a generic page builder: `SERVICES_LIST` has services with points because
 * the services band draws services with points, not because a "list section"
 * is a useful abstraction. When the site needs something new, the answer is a
 * new component and a new definition here — reviewed, and in code.
 *
 * Draft schemas are permissive so a half-written section always saves. Publish
 * schemas require only what would look broken live: a heading with no text, a
 * band of numbers with no numbers.
 */

/* ------------------------------------------------------------- Shared pieces */

const MARKETING = 'Marketing sections' as const

/** A repeatable `{ title, body }` pair, used by several bands. */
const titledItem = (titleMax: number, bodyMax: number) =>
  z.object({
    title: z.string().max(titleMax).default(''),
    body: z.string().max(bodyMax).default(''),
  })

/* ---------------------------------------------------------------- Page header */

const pageHeaderFields = z.object({
  eyebrow: z.string().max(40).default(''),
  title: z.string().max(200).default(''),
  description: z.string().max(400).default(''),
})

export const pageHeaderSection = defineSection({
  type: 'PAGE_HEADER',
  label: 'Page header',
  description: 'The masthead at the top of an interior page: label, headline, intro.',
  group: MARKETING,
  maxPerPage: 1,
  schema: pageHeaderFields,
  publishSchema: pageHeaderFields.extend({
    eyebrow: requiredText(40),
    title: requiredText(200),
  }),
  defaults: { eyebrow: '', title: '', description: '' },
})

/* ------------------------------------------------------------------ Home hero */

const homeHeroFields = z.object({
  /**
   * Written as one field with line breaks rather than a list of lines.
   *
   * The hero animates its headline line by line, so the breaks are real
   * content — but "press Enter where the line should break" is a thing anyone
   * understands, and a repeater of three one-word rows is not.
   */
  headline: z.string().max(200).default(''),
  subhead: z.string().max(400).default(''),
  primaryCta: ctaSchema.default({ label: '', href: '' }),
  secondaryCta: ctaSchema.default({ label: '', href: '' }),
})

export const homeHeroSection = defineSection({
  type: 'HOME_HERO',
  label: 'Home hero',
  description:
    'The opening band: animated headline, supporting paragraph, two buttons, and the layered composition.',
  group: MARKETING,
  maxPerPage: 1,
  schema: homeHeroFields,
  publishSchema: homeHeroFields.extend({ headline: requiredText(200) }),
  defaults: {
    headline: '',
    subhead: '',
    primaryCta: { label: 'Book a strategy call', href: '/book' },
    secondaryCta: { label: 'View case studies', href: '/case-studies' },
  },
})

/* ------------------------------------------------------------- Client marquee */

export const clientMarqueeSection = defineSection({
  type: 'CLIENT_MARQUEE',
  label: 'Client names',
  description: 'The scrolling row of client names, with an optional label above it.',
  group: MARKETING,
  schema: z.object({
    caption: z.string().max(120).default(''),
    clients: textList(30, 60),
  }),
  defaults: { caption: '', clients: [] },
})

/* -------------------------------------------------------------- Metrics band */

/**
 * Figures are **strings**, not numbers with a unit.
 *
 * These are editorial: "+44.5%", "$334.7K", "3x". A numeric field would force
 * the qualifier out of the value and into a label, which is exactly how a
 * figure loses the caveat that makes it true. `CountUp` animates the digits it
 * finds and leaves everything else alone.
 */
const figure = z.object({
  value: z.string().max(24).default(''),
  label: z.string().max(90).default(''),
})

export const metricsBandSection = defineSection({
  type: 'METRICS_BAND',
  label: 'Figures band',
  description:
    'A headline with a row of figures beneath it. Renders nothing while it has no figures.',
  group: MARKETING,
  schema: z.object({
    heading: z.string().max(200).default(''),
    body: z.string().max(400).default(''),
    metrics: z.array(figure).max(6).default([]),
  }),
  publishSchema: z.object({
    heading: z.string().max(200).default(''),
    body: z.string().max(400).default(''),
    // Not `.min(1)`: a figures band with nothing verified to put in it should
    // be publishable and simply absent, rather than pressuring whoever is
    // editing it to find a number that fills the space (DESIGN.md §Review 6).
    metrics: z
      .array(z.object({ value: requiredText(24), label: requiredText(90) }))
      .max(6)
      .default([]),
  }),
  defaults: { heading: '', body: '', metrics: [] },
})

/* --------------------------------------------------------- Services overview */

const overviewService = z.object({
  title: z.string().max(80).default(''),
  summary: z.string().max(320).default(''),
  points: textList(8, 120),
  href: z.string().max(300).default('/services'),
})

export const servicesOverviewSection = defineSection({
  type: 'SERVICES_OVERVIEW',
  label: 'Services overview',
  description:
    'The channels, as full-width ruled rows. Used on the homepage to point at the services page.',
  group: MARKETING,
  schema: z.object({
    heading: z.string().max(200).default(''),
    body: z.string().max(400).default(''),
    services: z.array(overviewService).max(6).default([]),
  }),
  publishSchema: z.object({
    heading: requiredText(200),
    body: z.string().max(400).default(''),
    services: z
      .array(overviewService.extend({ title: requiredText(80) }))
      .max(6)
      .default([]),
  }),
  defaults: { heading: '', body: '', services: [] },
})

/* ------------------------------------------------------------- Work index */

export const workIndexSection = defineSection({
  type: 'WORK_INDEX',
  label: 'Selected work',
  description:
    'Featured case studies as a ruled list. The studies themselves are edited under Case studies.',
  group: MARKETING,
  schema: z.object({
    eyebrow: z.string().max(40).default(''),
    allWorkLabel: z.string().max(40).default(''),
    heading: z.string().max(200).default(''),
    body: z.string().max(400).default(''),
    limit: z.number().int().min(1).max(6).default(3),
  }),
  publishSchema: z.object({
    eyebrow: z.string().max(40).default(''),
    allWorkLabel: z.string().max(40).default(''),
    heading: requiredText(200),
    body: z.string().max(400).default(''),
    limit: z.number().int().min(1).max(6).default(3),
  }),
  defaults: {
    eyebrow: 'Selected work',
    allWorkLabel: 'All work',
    heading: '',
    body: '',
    limit: 3,
  },
})

/* ---------------------------------------------------------------- Process */

const processStep = z.object({
  title: z.string().max(80).default(''),
  description: z.string().max(600).default(''),
})

export const processStepsSection = defineSection({
  type: 'PROCESS_STEPS',
  label: 'Process (short)',
  description:
    'Numbered engagement steps beside the automation diagram. The homepage version.',
  group: MARKETING,
  schema: z.object({
    heading: z.string().max(200).default(''),
    body: z.string().max(400).default(''),
    steps: z.array(processStep).max(8).default([]),
  }),
  publishSchema: z.object({
    heading: requiredText(200),
    body: z.string().max(400).default(''),
    steps: z
      .array(processStep.extend({ title: requiredText(80) }))
      .max(8)
      .default([]),
  }),
  defaults: { heading: '', body: '', steps: [] },
})

export const processDetailSection = defineSection({
  type: 'PROCESS_DETAIL',
  label: 'Process (full)',
  description:
    'The full step list with the automation diagram in a sticky column beside it.',
  group: MARKETING,
  schema: z.object({
    steps: z.array(processStep).max(8).default([]),
    asideEyebrow: z.string().max(40).default(''),
    asideBody: z.string().max(400).default(''),
  }),
  publishSchema: z.object({
    steps: z
      .array(processStep.extend({ title: requiredText(80) }))
      .max(8)
      .default([]),
    asideEyebrow: z.string().max(40).default(''),
    asideBody: z.string().max(400).default(''),
  }),
  defaults: { steps: [], asideEyebrow: '', asideBody: '' },
})

/* --------------------------------------------------------------- Statement */

const statementFields = z.object({
  statement: z.string().max(800).default(''),
  cta: ctaSchema.default({ label: '', href: '' }),
})

export const statementSection = defineSection({
  type: 'STATEMENT',
  label: 'Statement',
  description: 'One paragraph set large, alone on the page, with an optional button.',
  group: MARKETING,
  schema: statementFields,
  publishSchema: statementFields.extend({ statement: requiredText(800) }),
  defaults: { statement: '', cta: { label: '', href: '' } },
})

/* ------------------------------------------------------------ Testimonials */

export const testimonialsSection = defineSection({
  type: 'TESTIMONIALS',
  label: 'Testimonials',
  description:
    'Client quotes from Library → Testimonials. Renders nothing while there are none.',
  group: MARKETING,
  schema: z.object({ heading: z.string().max(200).default('') }),
  defaults: { heading: '' },
})

/* ---------------------------------------------------------------- Final CTA */

const finalCtaFields = z.object({
  heading: z.string().max(200).default(''),
  body: z.string().max(400).default(''),
  primaryCta: ctaSchema.default({ label: '', href: '' }),
  secondaryCta: ctaSchema.default({ label: '', href: '' }),
})

export const finalCtaSection = defineSection({
  type: 'FINAL_CTA',
  label: 'Closing call to action',
  description: 'The full-bleed navy band that closes a page.',
  group: MARKETING,
  maxPerPage: 1,
  schema: finalCtaFields,
  publishSchema: finalCtaFields.extend({ heading: requiredText(200) }),
  defaults: {
    heading: '',
    body: '',
    primaryCta: { label: 'Book a strategy call', href: '/book' },
    secondaryCta: { label: 'View case studies', href: '/case-studies' },
  },
})

/* ------------------------------------------------------------------- Values */

export const valuesSection = defineSection({
  type: 'VALUES',
  label: 'Beliefs list',
  description:
    'A standing statement in one column and a ruled list of beliefs in the other.',
  group: MARKETING,
  schema: z.object({
    eyebrow: z.string().max(40).default(''),
    statement: z.string().max(600).default(''),
    items: z.array(titledItem(90, 600)).max(8).default([]),
  }),
  publishSchema: z.object({
    eyebrow: z.string().max(40).default(''),
    statement: z.string().max(600).default(''),
    items: z
      .array(titledItem(90, 600).extend({ title: requiredText(90) }))
      .max(8)
      .default([]),
  }),
  defaults: { eyebrow: '', statement: '', items: [] },
})

/* ---------------------------------------------------------- Partner badges */

/**
 * Certification badges — Shopify Partner, Klaviyo Partner and the like.
 *
 * Images only, from the media library. There is deliberately no way to type a
 * partner's *name* as text and have it render: a badge is a claim about a
 * current commercial relationship, and the proof that the relationship exists is
 * possessing the official asset. A section that could render "Shopify Partner"
 * as a word would let the site make that claim without one.
 *
 * The band renders nothing until at least one badge has an image, so the
 * section can sit on the page waiting for assets without asserting anything.
 */
const partnerBadge = z.object({
  /** The official asset. Without it the badge is not drawn. */
  media: mediaRefSchema.optional(),
  /** Used as the image's alt text, e.g. "Shopify Partner". */
  name: z.string().max(60).default(''),
  /** Optional link to the partner directory listing. */
  href: hrefSchema.default(''),
})

export const partnerBadgesSection = defineSection({
  type: 'PARTNER_BADGES',
  label: 'Partner badges',
  description:
    'Official certification badges — Shopify Partner, Klaviyo Partner. Hidden until you add the artwork.',
  group: MARKETING,
  maxPerPage: 1,
  schema: z.object({
    label: z.string().max(60).default(''),
    badges: z.array(partnerBadge).max(4).default([]),
  }),
  publishSchema: z.object({
    label: z.string().max(60).default(''),
    // A badge with artwork must say what it is — that string is its alt text,
    // and an unlabelled badge is unreadable to a screen reader.
    badges: z
      .array(
        partnerBadge.refine((badge) => !badge.media || badge.name.trim().length > 0, {
          message: 'give this badge a name — it is read aloud in place of the image',
          path: ['name'],
        }),
      )
      .max(4)
      .default([]),
  }),
  defaults: { label: '', badges: [] },
})

/* ------------------------------------------------------------ Services list */

const detailedService = z.object({
  title: z.string().max(80).default(''),
  summary: z.string().max(320).default(''),
  description: z.string().max(1200).default(''),
  points: textList(10, 120),
})

export const servicesListSection = defineSection({
  type: 'SERVICES_LIST',
  label: 'Services in full',
  description:
    'Each service given a full band: name, summary, description, and what it includes.',
  group: MARKETING,
  schema: z.object({
    includesLabel: z.string().max(60).default(''),
    services: z.array(detailedService).max(6).default([]),
  }),
  publishSchema: z.object({
    includesLabel: z.string().max(60).default(''),
    services: z
      .array(detailedService.extend({ title: requiredText(80) }))
      .max(6)
      .default([]),
  }),
  defaults: { includesLabel: 'What that includes', services: [] },
})

export const servicesClosingSection = defineSection({
  type: 'SERVICES_CLOSING',
  label: 'Closing statement',
  description: 'A short label beside a large statement, under a teal rule.',
  group: MARKETING,
  schema: z.object({
    label: z.string().max(40).default(''),
    statement: z.string().max(600).default(''),
    body: z.string().max(900).default(''),
  }),
  publishSchema: z.object({
    label: z.string().max(40).default(''),
    statement: requiredText(600),
    body: z.string().max(900).default(''),
  }),
  defaults: { label: '', statement: '', body: '' },
})

/* --------------------------------------------------------- Case study index */

export const caseStudyListSection = defineSection({
  type: 'CASE_STUDY_LIST',
  label: 'All case studies',
  description:
    'Every published case study as a numbered index. Edited under Case studies.',
  group: MARKETING,
  schema: z.object({}),
  defaults: {},
})

/* -------------------------------------------------------------- Contact intro */

const contactIntroFields = z.object({
  eyebrow: z.string().max(40).default(''),
  headline: z.string().max(200).default(''),
  body: z.string().max(400).default(''),
  points: textList(6, 200),
  responseNote: z.string().max(120).default(''),
  /** The form's button and the message shown after a successful send. */
  submitLabel: z.string().max(60).default(''),
  successHeading: z.string().max(120).default(''),
  successBody: z.string().max(320).default(''),
})

export const contactIntroSection = defineSection({
  type: 'CONTACT_INTRO',
  label: 'Contact intro & form',
  description:
    'The contact headline, expectations and details, with the enquiry form beside it.',
  group: MARKETING,
  maxPerPage: 1,
  schema: contactIntroFields,
  publishSchema: contactIntroFields.extend({ headline: requiredText(200) }),
  defaults: {
    eyebrow: 'Contact',
    headline: '',
    body: '',
    points: [],
    responseNote: '',
    submitLabel: '',
    successHeading: '',
    successBody: '',
  },
})

/* --------------------------------------------------------------- Book details */

export const bookDetailsSection = defineSection({
  type: 'BOOK_DETAILS',
  label: 'Booking expectations & calendar',
  description:
    'What to expect from the call, beside the scheduler. The calendar link lives in Settings.',
  group: MARKETING,
  maxPerPage: 1,
  schema: z.object({
    points: textList(6, 200),
    writeFirstLabel: z.string().max(120).default(''),
  }),
  defaults: { points: [], writeFirstLabel: 'Prefer to write first?' },
})

/* -------------------------------------------------------- Shared item schema */

export type TitledItem = z.infer<ReturnType<typeof titledItem>>
