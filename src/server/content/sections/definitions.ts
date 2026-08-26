import { z } from 'zod'

import { richTextSchema } from '../schemas/rich-text'
import {
  defineSection,
  eyebrowSchema,
  linkSchema,
  mediaRefSchema,
  requiredText,
} from './types'

/**
 * The designed marketing bands live next door and are re-exported here, so the
 * registry keeps reading exactly one module (`Object.values(definitions)`) and
 * the two catalogues stay legible apart.
 */
export * from './marketing-definitions'

/**
 * The V1 section catalogue (CMS.md §3.5).
 *
 * Derived from the story the homepage needs to tell — claim, credibility,
 * proof, capability, evidence, partnership, objections, ask — not from a
 * template checklist. Notably absent, per the design brief: process diagrams,
 * fake dashboards, generic feature grids, pricing tables.
 *
 * Each definition carries a permissive **draft** schema and, where a field is
 * only mandatory once live, a stricter **publish** schema. An editor can always
 * save a half-finished section; they cannot publish one.
 */

const heroFields = z.object({
  eyebrow: eyebrowSchema,
  headline: z.string().max(160).default(''),
  subhead: z.string().max(320).optional(),
  primaryCta: linkSchema.optional(),
  secondaryCta: linkSchema.optional(),
  media: mediaRefSchema.optional(),
})

export const heroSection = defineSection({
  type: 'HERO',
  label: 'Hero',
  description: 'The claim. Full-width opening statement with a primary call to action.',
  group: 'Utility sections',
  maxPerPage: 1,
  schema: heroFields,
  publishSchema: heroFields.extend({ headline: requiredText(160) }),
  defaults: { headline: 'Email and SMS that behaves like part of your team.' },
})

export const logoStripSection = defineSection({
  type: 'LOGO_STRIP',
  label: 'Logo strip',
  description: 'Immediate credibility. Real client logos, drawn from the library.',
  group: 'Utility sections',
  schema: z.object({
    caption: z.string().max(120).optional(),
    /** Empty means "all published logos, in their configured order". */
    logoIds: z.array(z.string()).default([]),
  }),
  defaults: { logoIds: [] },
})

export const proofMetricsSection = defineSection({
  type: 'PROOF_METRICS',
  label: 'Proof metrics',
  description: 'Structured numbers with labels and timeframes.',
  group: 'Utility sections',
  schema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(160).optional(),
    metrics: z
      .array(
        z.object({
          label: z.string().max(80).default(''),
          value: z.number().default(0),
          unit: z.enum(['PERCENT', 'CURRENCY_USD', 'MULTIPLIER', 'ABSOLUTE']),
          timeframe: z.string().max(60).optional(),
        }),
      )
      .max(6)
      .default([]),
  }),
  publishSchema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(160).optional(),
    metrics: z
      .array(
        z.object({
          label: requiredText(80),
          value: z.number(),
          unit: z.enum(['PERCENT', 'CURRENCY_USD', 'MULTIPLIER', 'ABSOLUTE']),
          timeframe: z.string().max(60).optional(),
        }),
      )
      .min(1, 'Add at least one metric.')
      .max(6),
  }),
  defaults: {
    metrics: [{ label: 'Email revenue growth', value: 0, unit: 'PERCENT' as const }],
  },
})

export const narrativeSection = defineSection({
  type: 'NARRATIVE',
  label: 'Narrative',
  description: 'Long-form positioning copy, optionally paired with media.',
  group: 'Utility sections',
  schema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(200).optional(),
    body: richTextSchema.default([]),
    media: mediaRefSchema.optional(),
    mediaPosition: z.enum(['left', 'right', 'below']).default('right'),
  }),
  defaults: { body: [], mediaPosition: 'right' as const },
})

const serviceDetailFields = z.object({
  eyebrow: eyebrowSchema,
  heading: z.string().max(200).default(''),
  body: richTextSchema.default([]),
  outcomes: z
    .array(z.object({ title: z.string().max(80), detail: z.string().max(240) }))
    .max(6)
    .default([]),
  media: mediaRefSchema.optional(),
})

export const serviceDetailSection = defineSection({
  type: 'SERVICE_DETAIL',
  label: 'Service detail',
  description: 'Email or SMS capability, told as outcomes rather than deliverables.',
  group: 'Utility sections',
  schema: serviceDetailFields,
  publishSchema: serviceDetailFields.extend({ heading: requiredText(200) }),
  defaults: { heading: '', body: [], outcomes: [] },
})

export const emailGallerySection = defineSection({
  type: 'EMAIL_GALLERY',
  label: 'Email gallery',
  description: 'Real email designs from the library.',
  group: 'Utility sections',
  schema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(160).optional(),
    exampleIds: z.array(z.string()).default([]),
    layout: z.enum(['grid', 'marquee']).default('grid'),
  }),
  defaults: { exampleIds: [], layout: 'grid' as const },
})

const caseStudyFeatureFields = z.object({
  caseStudyId: z.string().default(''),
  eyebrow: eyebrowSchema,
})

export const caseStudyFeatureSection = defineSection({
  type: 'CASE_STUDY_FEATURE',
  label: 'Case study — feature',
  description: 'One case study, given room to breathe.',
  group: 'Utility sections',
  schema: caseStudyFeatureFields,
  publishSchema: caseStudyFeatureFields.extend({
    caseStudyId: requiredText(64),
  }),
  defaults: { caseStudyId: '' },
})

export const caseStudyGridSection = defineSection({
  type: 'CASE_STUDY_GRID',
  label: 'Case study — grid',
  description: 'Several case studies together.',
  group: 'Utility sections',
  schema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(160).optional(),
    caseStudyIds: z.array(z.string()).default([]),
    limit: z.number().int().min(1).max(12).default(6),
  }),
  defaults: { caseStudyIds: [], limit: 6 },
})

const testimonialFeatureFields = z.object({
  testimonialId: z.string().default(''),
})

export const testimonialFeatureSection = defineSection({
  type: 'TESTIMONIAL_FEATURE',
  label: 'Testimonial — feature',
  description: 'A single quote at scale.',
  group: 'Utility sections',
  schema: testimonialFeatureFields,
  publishSchema: testimonialFeatureFields.extend({
    testimonialId: requiredText(64),
  }),
  defaults: { testimonialId: '' },
})

export const testimonialGridSection = defineSection({
  type: 'TESTIMONIAL_GRID',
  label: 'Testimonial — grid',
  description: 'Several quotes together.',
  group: 'Utility sections',
  schema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(160).optional(),
    testimonialIds: z.array(z.string()).default([]),
  }),
  defaults: { testimonialIds: [] },
})

const partnershipFields = z.object({
  eyebrow: eyebrowSchema,
  heading: z.string().max(200).default(''),
  body: richTextSchema.default([]),
  points: z
    .array(z.object({ title: z.string().max(80), detail: z.string().max(240) }))
    .max(6)
    .default([]),
})

export const partnershipSection = defineSection({
  type: 'PARTNERSHIP',
  label: 'Partnership',
  description: 'The "extension of your team" argument.',
  group: 'Utility sections',
  schema: partnershipFields,
  publishSchema: partnershipFields.extend({ heading: requiredText(200) }),
  defaults: { heading: '', body: [], points: [] },
})

export const faqSection = defineSection({
  type: 'FAQ',
  label: 'FAQ',
  description: 'Objection handling, before the booking decision.',
  group: 'Utility sections',
  schema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(160).optional(),
    items: z
      .array(
        z.object({ question: z.string().max(200), answer: richTextSchema.default([]) }),
      )
      .max(12)
      .default([]),
  }),
  publishSchema: z.object({
    eyebrow: eyebrowSchema,
    heading: z.string().max(160).optional(),
    items: z
      .array(z.object({ question: requiredText(200), answer: richTextSchema }))
      .min(1, 'Add at least one question.')
      .max(12),
  }),
  defaults: { items: [{ question: '', answer: [] }] },
})

const ctaFields = z.object({
  eyebrow: eyebrowSchema,
  heading: z.string().max(200).default(''),
  body: z.string().max(320).optional(),
  primaryCta: linkSchema,
  secondaryCta: linkSchema.optional(),
})

export const ctaSection = defineSection({
  type: 'CTA',
  label: 'Call to action',
  description: 'The booking ask.',
  group: 'Utility sections',
  schema: ctaFields,
  publishSchema: ctaFields.extend({ heading: requiredText(200) }),
  defaults: {
    heading: 'Book a strategy call',
    primaryCta: { label: 'Book a call', href: '/contact' },
  },
})

export const richTextSection = defineSection({
  type: 'RICH_TEXT',
  label: 'Rich text',
  description: 'Prose for legal and utility pages.',
  group: 'Utility sections',
  schema: z.object({
    heading: z.string().max(200).optional(),
    body: richTextSchema.default([]),
  }),
  defaults: { body: [] },
})
