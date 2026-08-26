import 'server-only'

import { z } from 'zod'

import { prisma } from '@/db/prisma'

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

/**
 * The ids a document depends on.
 *
 * Only the sections that store a reference appear here. Everything else is
 * literal content and cannot break by pointing at something deleted.
 */
const referenceCollectors: Partial<
  Record<SectionType, (data: Record<string, unknown>) => References>
> = {
  PARTNER_BADGES: (data) => ({ media: badgeMediaIds(data['badges']) }),
}

type References = {
  media?: string[]
}

/** Each badge holds its own optional media reference. */
function badgeMediaIds(value: unknown): string[] {
  const parsed = z
    .array(z.object({ media: z.object({ mediaId: z.string() }).optional() }))
    .safeParse(value)

  if (!parsed.success) return []

  return parsed.data
    .map((badge) => badge.media?.mediaId)
    .filter((id): id is string => Boolean(id))
}

export async function findBrokenReferences(
  content: PageContent,
): Promise<PublishIssue[]> {
  const perSection = new Map<string, string[]>()

  for (const section of content.sections) {
    if (!section.isEnabled) continue
    const collect = referenceCollectors[section.type as SectionType]
    if (!collect) continue

    const ids = collect((section.data ?? {}) as Record<string, unknown>).media ?? []
    if (ids.length > 0) perSection.set(section.id, ids)
  }

  const wanted = [...new Set([...perSection.values()].flat())]
  if (wanted.length === 0) return []

  const found = new Set(
    (
      await prisma.mediaAsset.findMany({
        where: { id: { in: wanted }, deletedAt: null },
        select: { id: true },
      })
    ).map((row) => row.id),
  )

  const issues: PublishIssue[] = []

  for (const [sectionId, ids] of perSection) {
    if (ids.some((id) => !found.has(id))) {
      issues.push({
        sectionId,
        sectionLabel: labelForSection(content, sectionId),
        message: 'references an image that no longer exists',
      })
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

/**
 * Turns validation issues into something an editor can act on.
 *
 * The audience is a business owner looking at a page that will not publish, so
 * the message has to name the section and say what to do. "Required" on its own
 * is a dead end when the honest answer is often "you did not want this band at
 * all" — hiding a section is the supported way to leave one out, and nothing
 * else in the interface says so at the moment it matters.
 */
export function describeIssues(issues: PublishIssue[]): string {
  const described = issues
    .slice(0, 3)
    .map((issue) =>
      issue.sectionLabel ? `${issue.sectionLabel} — ${issue.message}` : issue.message,
    )

  const suffix = issues.length > 3 ? ` (and ${issues.length - 3} more)` : ''
  const named = issues.some((issue) => issue.sectionLabel)

  return (
    `Not published yet — ${described.join('; ')}${suffix}.` +
    (named
      ? ' Fill the field in, or hide that section if you do not want it on the page.'
      : '')
  )
}
