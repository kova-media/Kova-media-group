import { z } from 'zod'

import { logger } from '@/lib/logger'

import {
  caseStudyNarrativeSchema,
  emptyCaseStudyNarrative,
  parseStoredNarrative,
  type CaseStudyNarrative,
} from './case-study'

import {
  publishSectionSchema,
  sectionSchema,
  sectionRegistry,
  type ValidatedSection,
} from '../sections/registry'
import type { SectionType } from '../sections/types'

/**
 * The content document (ADR-012). One JSON column holds an ordered array of
 * sections; array order *is* section order, so there is no position field to
 * renumber.
 */
export const pageContentSchema = z.object({
  sections: z.array(sectionSchema).default([]),
})

/** Applied at publish time: enabled sections must be complete (CMS.md §4.3). */
export const publishPageContentSchema = z.object({
  sections: z.array(publishSectionSchema).default([]),
})

export type PageContent = { sections: ValidatedSection[] }

export const emptyPageContent: PageContent = { sections: [] }

export const caseStudyMetricSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.number(),
  unit: z.enum(['PERCENT', 'CURRENCY_USD', 'MULTIPLIER', 'ABSOLUTE']),
  timeframe: z.string().max(60).optional(),
})

export const caseStudyContentSchema = z.object({
  sections: z.array(sectionSchema).default([]),
  metrics: z.array(caseStudyMetricSchema).default([]),
  /**
   * The designed case-study template's content (see schemas/case-study.ts).
   * `sections` remains for anything a study needs beyond that template; the
   * narrative is what the v0 detail page actually renders.
   */
  narrative: caseStudyNarrativeSchema.default(emptyCaseStudyNarrative),
})

export type CaseStudyMetric = z.infer<typeof caseStudyMetricSchema>
export type CaseStudyContent = {
  sections: ValidatedSection[]
  metrics: CaseStudyMetric[]
  narrative: CaseStudyNarrative
}

export const emptyCaseStudyContent: CaseStudyContent = {
  sections: [],
  metrics: [],
  narrative: emptyCaseStudyNarrative,
}

/**
 * Parses a stored document, dropping sections that no longer validate.
 *
 * Used on the **read** path. A published document is validated on write, so a
 * failure here means the code changed underneath stored content — a section
 * type was removed or its schema tightened. Dropping the offending section and
 * logging beats taking a live page down over one stale block.
 *
 * The admin's editing path uses `pageContentSchema` directly, so an editor sees
 * a real validation error instead of silently losing a section.
 */
export function parseStoredPageContent(value: unknown, context: string): PageContent {
  const parsed = pageContentSchema.safeParse(value)

  if (parsed.success) {
    return { sections: parsed.data.sections as ValidatedSection[] }
  }

  const raw = (value ?? {}) as { sections?: unknown }
  const sections = Array.isArray(raw.sections) ? raw.sections : []
  const kept: ValidatedSection[] = []

  for (const section of sections) {
    const result = sectionSchema.safeParse(section)
    if (result.success) {
      kept.push(result.data as ValidatedSection)
    } else {
      logger.warn('Dropped invalid section while reading content', {
        context,
        sectionType: (section as { type?: unknown })?.type,
        issues: result.error.issues.map((issue) => issue.message),
      })
    }
  }

  return { sections: kept }
}

export function parseStoredCaseStudyContent(
  value: unknown,
  context: string,
): CaseStudyContent {
  const parsed = caseStudyContentSchema.safeParse(value)

  if (parsed.success) {
    return {
      sections: parsed.data.sections as ValidatedSection[],
      metrics: parsed.data.metrics,
      narrative: parsed.data.narrative,
    }
  }

  const { sections } = parseStoredPageContent(value, context)
  const raw = (value ?? {}) as { metrics?: unknown; narrative?: unknown }
  const metrics = z.array(caseStudyMetricSchema).safeParse(raw.metrics)

  return {
    sections,
    metrics: metrics.success ? metrics.data : [],
    narrative: parseStoredNarrative(raw.narrative),
  }
}

/** A new section, with the defaults registered for its type. */
export function createSection(type: SectionType, id: string): ValidatedSection {
  return {
    id,
    type,
    isEnabled: true,
    data: sectionRegistry[type].defaults,
  }
}
