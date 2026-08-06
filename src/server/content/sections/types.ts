import { z } from 'zod'

/**
 * Section types are a TypeScript union owned by the registry — deliberately NOT
 * a Postgres enum (ADR-012). Adding a section type must not require a migration.
 *
 * The friction that protects design quality is having to write a component; an
 * enum migration would add ceremony without adding safety.
 */
export const SECTION_TYPES = [
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
}

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

export const eyebrowSchema = z.string().max(60).optional()
