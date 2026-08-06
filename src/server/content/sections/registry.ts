import { z } from 'zod'

import * as definitions from './definitions'
import { SECTION_TYPES, type SectionDefinition, type SectionType } from './types'

/**
 * The section registry — the single source of truth for what a section type is
 * (CMS.md §3.2).
 *
 * Three consumers read this same object, so they cannot drift:
 *   - the admin editor (label, description, schema → form, defaults)
 *   - Server Actions (schema → validation before write)
 *   - the public renderer (type → React component, registered separately in
 *     src/features/sections/registry.tsx so this module stays JSX-free)
 *
 * No JSX here on purpose: this must be importable from contexts that should not
 * pull a React tree in, including the seed script and tests.
 */

const ALL_DEFINITIONS = Object.values(definitions) as SectionDefinition[]

export const sectionRegistry = Object.fromEntries(
  ALL_DEFINITIONS.map((definition) => [definition.type, definition]),
) as Record<SectionType, SectionDefinition>

/**
 * Every declared section type must have a definition. Throwing at module load
 * turns "someone added a type and forgot the definition" into an immediate,
 * unmissable failure rather than a section that silently never renders.
 */
const missing = SECTION_TYPES.filter((type) => !sectionRegistry[type])

if (missing.length > 0) {
  throw new Error(`Section types missing a registry definition: ${missing.join(', ')}`)
}

export function getSectionDefinition(type: SectionType): SectionDefinition {
  return sectionRegistry[type]
}

/** Ordered for the admin's "add section" menu. */
export const sectionCatalogue = SECTION_TYPES.map((type) => {
  const definition = sectionRegistry[type]
  return {
    type,
    label: definition.label,
    description: definition.description,
    maxPerPage: definition.maxPerPage,
  }
})

/**
 * A section, validated against the schema registered for its own type.
 *
 * Written as a `superRefine` rather than a discriminated union so that an
 * unrecognised type is a *soft* failure the caller can drop, instead of taking
 * the whole document down. Old documents referencing a removed section type
 * must degrade gracefully (CMS.md §3.3).
 */
function buildSectionSchema(mode: 'draft' | 'publish') {
  return z
    .object({
      id: z.string().min(1),
      type: z.string().min(1),
      isEnabled: z.boolean().default(true),
      data: z.unknown(),
    })
    .superRefine((section, ctx) => {
      const definition = sectionRegistry[section.type as SectionType]

      if (!definition) {
        ctx.addIssue({
          code: 'custom',
          path: ['type'],
          message: `Unknown section type: ${section.type}`,
        })
        return
      }

      // A disabled section is not rendered, so it need not be publish-complete.
      // Otherwise an editor could never park a half-built section and ship the
      // rest of the page.
      const schema =
        mode === 'publish' && section.isEnabled
          ? (definition.publishSchema ?? definition.schema)
          : definition.schema

      const result = schema.safeParse(section.data)

      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({ ...issue, path: ['data', ...issue.path] })
        }
      }
    })
}

/** Draft rules: shape and upper bounds, tolerant of unfinished content. */
export const sectionSchema = buildSectionSchema('draft')

/** Publish rules: everything above, plus required fields on enabled sections. */
export const publishSectionSchema = buildSectionSchema('publish')

export type ValidatedSection = {
  id: string
  type: SectionType
  isEnabled: boolean
  data: unknown
}
