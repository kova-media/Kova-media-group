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

/**
 * The heading each fixed block renders under.
 *
 * Editable because they are words on the page, and the rule for this work is
 * that no displayed text requires a deploy to change. They are *not* free-form
 * structure: the blocks and their order stay fixed, and a heading left blank
 * falls back to the default below rather than rendering an unlabelled slab.
 */
export const caseStudyLabelsSchema = z.object({
  background: z.string().max(40).default(''),
  challenge: z.string().max(40).default(''),
  design: z.string().max(40).default(''),
  automation: z.string().max(40).default(''),
  sms: z.string().max(40).default(''),
  strategy: z.string().max(40).default(''),
  next: z.string().max(40).default(''),
})

export type CaseStudyLabels = z.infer<typeof caseStudyLabelsSchema>

export const DEFAULT_CASE_STUDY_LABELS: Required<CaseStudyLabels> = {
  background: 'Background',
  challenge: 'The challenge',
  design: 'Design',
  automation: 'Automation',
  sms: 'SMS',
  strategy: 'Strategy',
  next: 'Next case study',
}

/**
 * An additional labelled block, rendered after the fixed ones.
 *
 * The named fields cover the shape every Kova engagement has had so far. This
 * is the escape hatch for the one that does not — a heading and a paragraph,
 * added in the admin, with no new section type required.
 */
export const caseStudyBlockSchema = z.object({
  label: z.string().max(40).default(''),
  body: z.string().max(2000).default(''),
})

export type CaseStudyBlock = z.infer<typeof caseStudyBlockSchema>

/**
 * The closing call to action for a single study.
 *
 * Blank by default, and blank means "use the site-wide closing band". A study
 * only overrides it when the ask genuinely differs.
 */
export const caseStudyCtaSchema = z.object({
  heading: z.string().max(200).default(''),
  body: z.string().max(400).default(''),
  primaryLabel: z.string().max(60).default(''),
  primaryHref: z.string().max(300).default(''),
  secondaryLabel: z.string().max(60).default(''),
  secondaryHref: z.string().max(300).default(''),
})

export type CaseStudyCta = z.infer<typeof caseStudyCtaSchema>

export const caseStudyNarrativeSchema = z.object({
  background: z.string().max(2000).default(''),
  challenge: z.string().max(2000).default(''),
  strategy: z.array(z.string().max(300)).max(8).default([]),
  design: z.string().max(2000).default(''),
  automation: z.string().max(2000).default(''),
  sms: z.string().max(2000).default(''),
  blocks: z.array(caseStudyBlockSchema).max(6).default([]),
  // Parsed rather than `{}`: Zod returns a default value verbatim without
  // re-validating it, so `{}` would reach the renderer missing every key.
  labels: caseStudyLabelsSchema.default(() => caseStudyLabelsSchema.parse({})),
  cta: caseStudyCtaSchema.default(() => caseStudyCtaSchema.parse({})),
  results: z.array(caseStudyResultSchema).max(6).default([]),
  /**
   * The window the results cover, e.g. 'November 2024 – July 2025'.
   *
   * A percentage survives without its timeframe; an absolute figure does not.
   * Absolute figures belong in the narrative prose, where the sentence carries
   * the period — this labels the headline band so a reader knows what window
   * those figures describe. Blank when there is no stated period.
   */
  resultsPeriod: z.string().max(80).default(''),
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
 * Publish rules: a live case study must actually say something.
 *
 * Background is the bar, and it is the only one. Requiring a challenge and at
 * least one result — as this did — assumed every engagement has a verified
 * figure to show and a story about what was wrong before. Some do not, and a
 * publish gate that can only be satisfied by inventing something is worse than
 * no gate: a study with two verified numbers and one blank heading is honest,
 * and the schema should let it through.
 */
export const publishCaseStudyNarrativeSchema = caseStudyNarrativeSchema.extend({
  background: z.string().min(1, 'Background is required to publish.').max(2000),
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
