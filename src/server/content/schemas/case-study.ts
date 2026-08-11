import { z } from 'zod'

/**
 * The case study narrative document.
 *
 * The v0 case study page is a **designed** template, not a stack of arbitrary
 * sections: it renders Background, The challenge, Strategy, Design, Automation
 * and SMS in a fixed order, with a results band across the top. So the content
 * model matches that template field for field rather than pretending it is a
 * free-form page — the CMS controls what each block says, never where it goes
 * or what it looks like.
 *
 * This lives inside the existing `draftContent` / `publishedContent` JSON
 * columns, so it inherits the whole Phase 3 publish, revision and preview
 * machinery for free (ADR-012).
 */

/**
 * A headline result, e.g. `{ value: '3x', label: 'Increase in email revenue' }`.
 *
 * `value` is a **string**, not a number with a unit. These are editorial
 * figures — "3x", "40%+", "+18%" — and forcing them through a numeric schema
 * would lose the qualifier that makes them honest. `CountUp` parses the numeric
 * portion out for the animation and leaves the rest intact.
 */
export const caseStudyResultSchema = z.object({
  value: z.string().min(1).max(24),
  label: z.string().min(1).max(80),
})

export type CaseStudyResult = z.infer<typeof caseStudyResultSchema>

/** Fallback accent when a study has none. Matches the brand blue. */
export const DEFAULT_CASE_STUDY_ACCENT = 'oklch(0.55 0.19 262)'

export const caseStudyNarrativeSchema = z.object({
  background: z.string().max(2000).default(''),
  challenge: z.string().max(2000).default(''),
  strategy: z.array(z.string().max(300)).max(8).default([]),
  design: z.string().max(2000).default(''),
  automation: z.string().max(2000).default(''),
  sms: z.string().max(2000).default(''),
  results: z.array(caseStudyResultSchema).max(6).default([]),
  /**
   * A CSS colour used for this study's accent — the results figures, the
   * hero dot, the card wash. Stored as an authored string so the editor can
   * pick something that suits the brand rather than being limited to a
   * palette enum.
   */
  accent: z.string().max(64).default(DEFAULT_CASE_STUDY_ACCENT),
})

export type CaseStudyNarrative = z.infer<typeof caseStudyNarrativeSchema>

export const emptyCaseStudyNarrative: CaseStudyNarrative =
  caseStudyNarrativeSchema.parse({})

/**
 * Publish rules: a live case study must actually say something. A study with
 * no background and no results is a placeholder, not a page.
 */
export const publishCaseStudyNarrativeSchema = caseStudyNarrativeSchema.extend({
  background: z.string().min(1, 'Background is required to publish.').max(2000),
  challenge: z.string().min(1, 'The challenge is required to publish.').max(2000),
  results: z
    .array(caseStudyResultSchema)
    .min(1, 'Add at least one result.')
    .max(6),
})

/**
 * Reads a stored narrative, falling back to empty rather than throwing.
 *
 * Used on the read path: a published document is validated on write, so a
 * failure here means the code changed underneath stored content. Degrading to
 * blanks beats taking a live page down.
 */
export function parseStoredNarrative(value: unknown): CaseStudyNarrative {
  const parsed = caseStudyNarrativeSchema.safeParse(value)
  return parsed.success ? parsed.data : emptyCaseStudyNarrative
}
