import { z } from 'zod'

/**
 * Section types are a TypeScript union owned by the registry — deliberately NOT
 * a Postgres enum (ADR-012). Adding a section type must not require a migration.
 *
 * The friction that protects design quality is having to write a component; an
 * enum migration would add ceremony without adding safety.
 */
export const SECTION_TYPES = [
  // ---------------------------------------------------------------- Marketing
  // The designed bands of the public site. Each one is a component that already
  // exists in `src/features/marketing/**`; the section type is that component's
  // content, and nothing else. Adding one to a page does not compose a new
  // layout — it places a band that a designer built.
  'PAGE_HEADER',
  'HOME_HERO',
  'CLIENT_MARQUEE',
  'METRICS_BAND',
  'SERVICES_OVERVIEW',
  'WORK_INDEX',
  'PROCESS_STEPS',
  'STATEMENT',
  'TESTIMONIALS',
  'FINAL_CTA',
  'VALUES',
  'SERVICES_LIST',
  'SERVICES_CLOSING',
  'PROCESS_DETAIL',
  'CASE_STUDY_LIST',
  'CONTACT_INTRO',
  'BOOK_DETAILS',

  // ------------------------------------------------------------------ Utility
  // The original generic catalogue, used by the legal and utility pages that
  // render through the `[...slug]` catch-all.
  'HERO',
  'LOGO_STRIP',
  'PROOF_METRICS',
  'NARRATIVE',
  'SERVICE_DETAIL',
  'EMAIL_GALLERY',
  'CASE_STUDY_FEATURE',
  'CASE_STUDY_GRID',
  'TESTIMONIAL_FEATURE',
  'TESTIMONIAL_GRID',
  'PARTNERSHIP',
  'FAQ',
  'CTA',
  'RICH_TEXT',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

export const sectionTypeSchema = z.enum(SECTION_TYPES)

/**
 * A section definition. `schema` is the single source of truth for that
 * section's data: the admin form is derived from it, the Server Action
 * validates with it, and the renderer's props are inferred from it.
 */
export type SectionDefinition<S extends z.ZodType = z.ZodType> = {
  type: SectionType
  /** Shown in the admin's "add section" list. */
  label: string
  /** One line explaining what the section is for, shown beneath the label. */
  description: string
  /**
   * The **draft** schema. Enforces shape and upper bounds, but tolerates the
   * half-finished state a section is in the moment an editor adds it — a
   * headline the editor has not typed yet is not a validation error.
   */
  schema: S
  /**
   * The **publish** schema, when a section has fields that are optional while
   * drafting but mandatory once live (a headline, a referenced case study).
   * Defaults to `schema` when the draft rules are already sufficient.
   *
   * This is the split that keeps "save a work in progress" and "do not ship a
   * half-built section" from fighting each other.
   */
  publishSchema?: z.ZodType
  /** Applied when the editor adds the section. Must satisfy `schema`. */
  defaults: z.infer<S>
  /** Optional constraint: at most N of this type on a page. */
  maxPerPage?: number
  /**
   * Which heading the admin's "add section" list files this under. Purely an
   * organising device for a catalogue that is now long enough to need one —
   * nothing behaves differently.
   */
  group?: SectionGroup
}

export const SECTION_GROUPS = ['Marketing sections', 'Utility sections'] as const
export type SectionGroup = (typeof SECTION_GROUPS)[number]

/** Non-empty after trimming. Used for fields that are required to publish. */
export const requiredText = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => value.trim().length > 0, { message: 'This field is required.' })

export function defineSection<S extends z.ZodType>(
  definition: SectionDefinition<S>,
): SectionDefinition<S> {
  return definition
}

/** Shared field schemas, so media and link fields look identical everywhere. */
export const mediaRefSchema = z.object({
  mediaId: z.string().min(1),
  /** Overrides the asset's own alt text where a usage needs different context. */
  altOverride: z.string().optional(),
})

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
})

/**
 * Where an editor-supplied link is allowed to point.
 *
 * Anything an editor types ends up in an `href`, so the scheme is checked here
 * rather than trusted: a relative path, an absolute https URL, a mailto/tel
 * link, or an in-page anchor. `javascript:` and `data:` are the reason this
 * exists. An empty string is permitted so a call to action can be left blank —
 * the renderer drops a link with no target rather than emitting `href=""`.
 */
const SAFE_HREF = /^(?:\/[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+|#[^\s]*)$/

export const hrefSchema = z
  .string()
  .max(300)
  .refine((value) => value === '' || SAFE_HREF.test(value), {
    message: 'Use a path like /book, or an https:, mailto: or tel: link.',
  })

/**
 * An optional call to action.
 *
 * Both halves default to empty and the renderer hides a button whose label or
 * target is blank, so "no CTA here" is expressible without a separate toggle —
 * which is what stops an editor from leaving a button that goes nowhere.
 */
export const ctaSchema = z.object({
  label: z.string().max(60).default(''),
  href: hrefSchema.default(''),
})

export type Cta = z.infer<typeof ctaSchema>

/** A repeatable list of plain strings (bullet points, client names). */
export const textList = (max: number, itemMax: number) =>
  z.array(z.string().max(itemMax)).max(max).default([])

export const eyebrowSchema = z.string().max(60).optional()
