import 'server-only'

import { z } from 'zod'

import { prisma } from '@/db/prisma'
import { Prisma } from '@/generated/prisma/client'

import { publishPageContentSchema, type PageContent } from './schemas/page'
import { getSectionDefinition } from './sections/registry'
import type { SectionType } from './sections/types'

/**
 * Publish-time validation (CMS.md §4.3).
 *
 * Two checks, in order:
 *   1. The document satisfies the **publish** schema — enabled sections are
 *      complete, not merely well-shaped.
 *   2. Every reference the document holds still resolves. A section pointing at
 *      a deleted image must fail the publish with a message naming the section,
 *      rather than shipping a hole in the page.
 */

export type PublishIssue = {
  sectionId: string | null
  sectionLabel: string | null
  message: string
}

export type PublishValidation =
  { ok: true; content: PageContent } | { ok: false; issues: PublishIssue[] }

function labelForSection(
  content: PageContent,
  sectionId: string | null,
): string | null {
  if (!sectionId) return null
  const section = content.sections.find((candidate) => candidate.id === sectionId)
  if (!section) return null

  return getSectionDefinition(section.type as SectionType)?.label ?? section.type
}

/** Section index from a Zod issue path like `sections.2.data.headline`. */
function sectionIdFromPath(content: PageContent, path: PropertyKey[]): string | null {
  if (path[0] !== 'sections') return null
  const index = Number(path[1])
  if (!Number.isInteger(index)) return null

  return content.sections[index]?.id ?? null
}

/** Media, testimonial and case study ids a document depends on. */
const referenceCollectors: Partial<
  Record<SectionType, (data: Record<string, unknown>) => References>
> = {
  HERO: (data) => ({ media: mediaIds(data['media']) }),
  NARRATIVE: (data) => ({ media: mediaIds(data['media']) }),
  SERVICE_DETAIL: (data) => ({ media: mediaIds(data['media']) }),
  LOGO_STRIP: (data) => ({ logos: stringArray(data['logoIds']) }),
  EMAIL_GALLERY: (data) => ({ emailExamples: stringArray(data['exampleIds']) }),
  TESTIMONIAL_FEATURE: (data) => ({
    testimonials: stringOrNothing(data['testimonialId']),
  }),
  TESTIMONIAL_GRID: (data) => ({ testimonials: stringArray(data['testimonialIds']) }),
  CASE_STUDY_FEATURE: (data) => ({ caseStudies: stringOrNothing(data['caseStudyId']) }),
  CASE_STUDY_GRID: (data) => ({ caseStudies: stringArray(data['caseStudyIds']) }),
}

type References = {
  media?: string[]
  testimonials?: string[]
  logos?: string[]
  emailExamples?: string[]
  caseStudies?: string[]
}

function stringArray(value: unknown): string[] {
  const parsed = z.array(z.string()).safeParse(value)
  return parsed.success ? parsed.data.filter(Boolean) : []
}

function stringOrNothing(value: unknown): string[] {
  return typeof value === 'string' && value.length > 0 ? [value] : []
}

function mediaIds(value: unknown): string[] {
  const parsed = z.object({ mediaId: z.string() }).safeParse(value)
  return parsed.success && parsed.data.mediaId ? [parsed.data.mediaId] : []
}

export async function findBrokenReferences(
  content: PageContent,
): Promise<PublishIssue[]> {
  const perSection = new Map<string, References>()

  for (const section of content.sections) {
    if (!section.isEnabled) continue
    const collect = referenceCollectors[section.type as SectionType]
    if (!collect) continue
    perSection.set(section.id, collect((section.data ?? {}) as Record<string, unknown>))
  }

  const all = [...perSection.values()]
  const mediaWanted = [...new Set(all.flatMap((refs) => refs.media ?? []))]
  const testimonialsWanted = [
    ...new Set(all.flatMap((refs) => refs.testimonials ?? [])),
  ]
  const logosWanted = [...new Set(all.flatMap((refs) => refs.logos ?? []))]
  const examplesWanted = [...new Set(all.flatMap((refs) => refs.emailExamples ?? []))]
  const caseStudiesWanted = [...new Set(all.flatMap((refs) => refs.caseStudies ?? []))]

  const [media, testimonials, logos, examples, caseStudies] = await Promise.all([
    mediaWanted.length
      ? prisma.mediaAsset.findMany({
          where: { id: { in: mediaWanted }, deletedAt: null },
          select: { id: true },
        })
      : [],
    testimonialsWanted.length
      ? prisma.testimonial.findMany({
          where: { id: { in: testimonialsWanted }, isPublished: true },
          select: { id: true },
        })
      : [],
    logosWanted.length
      ? prisma.partnerLogo.findMany({
          where: { id: { in: logosWanted }, isPublished: true },
          select: { id: true },
        })
      : [],
    examplesWanted.length
      ? prisma.emailExample.findMany({
          where: { id: { in: examplesWanted }, isPublished: true },
          select: { id: true },
        })
      : [],
    caseStudiesWanted.length
      ? prisma.caseStudy.findMany({
          where: {
            id: { in: caseStudiesWanted },
            publishedContent: { not: Prisma.DbNull },
          },
          select: { id: true },
        })
      : [],
  ])

  const found = {
    media: new Set(media.map((row) => row.id)),
    testimonials: new Set(testimonials.map((row) => row.id)),
    logos: new Set(logos.map((row) => row.id)),
    emailExamples: new Set(examples.map((row) => row.id)),
    caseStudies: new Set(caseStudies.map((row) => row.id)),
  }

  const messages: Record<keyof References, string> = {
    media: 'references an image that no longer exists',
    testimonials: 'references a testimonial that is missing or unpublished',
    logos: 'references a partner logo that is missing or unpublished',
    emailExamples: 'references an email example that is missing or unpublished',
    caseStudies: 'references a case study that is missing or unpublished',
  }

  const issues: PublishIssue[] = []

  for (const [sectionId, refs] of perSection) {
    for (const key of Object.keys(messages) as (keyof References)[]) {
      const missing = (refs[key] ?? []).filter((id) => !found[key].has(id))
      if (missing.length > 0) {
        issues.push({
          sectionId,
          sectionLabel: labelForSection(content, sectionId),
          message: messages[key],
        })
      }
    }
  }

  return issues
}

export async function validateForPublish(draft: unknown): Promise<PublishValidation> {
  const parsed = publishPageContentSchema.safeParse(draft)

  if (!parsed.success) {
    const content = (draft ?? { sections: [] }) as PageContent
    const issues: PublishIssue[] = parsed.error.issues.map((issue) => {
      const sectionId = sectionIdFromPath(content, issue.path)
      return {
        sectionId,
        sectionLabel: labelForSection(content, sectionId),
        message: issue.message,
      }
    })

    return { ok: false, issues }
  }

  const content = { sections: parsed.data.sections } as PageContent
  const broken = await findBrokenReferences(content)

  if (broken.length > 0) {
    return { ok: false, issues: broken }
  }

  return { ok: true, content }
}

export function describeIssues(issues: PublishIssue[]): string {
  const described = issues
    .slice(0, 3)
    .map((issue) =>
      issue.sectionLabel ? `${issue.sectionLabel}: ${issue.message}` : issue.message,
    )

  const suffix = issues.length > 3 ? ` (and ${issues.length - 3} more)` : ''

  return `Cannot publish — ${described.join('; ')}${suffix}`
}
