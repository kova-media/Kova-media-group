import { z } from 'zod'

import { richTextSchema } from '../schemas/rich-text'
import { defineSection, eyebrowSchema, requiredText } from './types'

/**
 * The two utility sections, used by the FAQ and the legal pages.
 *
 * The rest of the original V1 catalogue — a generic hero, a logo strip, proof
 * metrics, narrative, service detail, partnership, email gallery, case-study
 * and testimonial blocks, a generic CTA — has been removed. Those types were
 * drawn by a second, older renderer that no longer exists, so leaving them
 * registered would put a dozen entries in the admin's "add section" list that
 * produce nothing at all on the page. A control that can never produce content
 * is worse than a missing feature.
 *
 * The designed marketing bands live next door and are re-exported here, so the
 * registry keeps reading exactly one module.
 */
export * from './marketing-definitions'

export const faqSection = defineSection({
  type: 'FAQ',
  label: 'FAQ',
  description: 'Objection handling, as an accordion.',
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

export const richTextSection = defineSection({
  type: 'RICH_TEXT',
  label: 'Prose',
  description: 'Long-form copy for the FAQ and legal pages.',
  group: 'Utility sections',
  schema: z.object({
    heading: z.string().max(200).optional(),
    body: richTextSchema.default([]),
  }),
  defaults: { body: [] },
})
