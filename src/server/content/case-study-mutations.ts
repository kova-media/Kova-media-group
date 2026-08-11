import 'server-only'

import { prisma } from '@/db/prisma'
import { Prisma } from '@/generated/prisma/client'

import { DraftConflictError } from './mutations'
import type { CaseStudyNarrative } from './schemas/case-study'

/**
 * Case study writes.
 *
 * Mirrors `mutations.ts` for pages: authorization and cache invalidation happen
 * in the calling Server Action, this module owns the database work only.
 */

export type CaseStudyFields = {
  slug: string
  clientName: string
  headline: string
  summary: string
  industry: string | null
  heroImageId: string | null
  clientLogoId: string | null
  isFeatured: boolean
  seoTitle: string | null
  seoDescription: string | null
}

export async function createCaseStudy(
  input: Pick<CaseStudyFields, 'slug' | 'clientName' | 'headline'>,
): Promise<{ id: string }> {
  // New studies sort to the end rather than the top: position 0 is a deliberate
  // editorial choice, not a side effect of being newest.
  const last = await prisma.caseStudy.findFirst({
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  return prisma.caseStudy.create({
    data: {
      slug: input.slug,
      clientName: input.clientName,
      headline: input.headline,
      summary: '',
      position: (last?.position ?? -1) + 1,
      draftContent: { sections: [], metrics: [], narrative: {} },
    },
    select: { id: true },
  })
}

export async function updateCaseStudyFields(
  id: string,
  fields: CaseStudyFields,
): Promise<{ previousSlug: string; slug: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.caseStudy.findUniqueOrThrow({
      where: { id },
      select: { slug: true },
    })

    await tx.caseStudy.update({ where: { id }, data: fields })

    return { previousSlug: existing.slug, slug: fields.slug }
  })
}

/**
 * Saves the narrative draft, guarding against a stale tab.
 *
 * The version is part of the WHERE clause rather than a read-then-check, so two
 * concurrent saves cannot both pass the check before either writes.
 */
export async function saveCaseStudyDraft(
  id: string,
  narrative: CaseStudyNarrative,
  expectedVersion: number,
): Promise<number> {
  const current = await prisma.caseStudy.findUniqueOrThrow({
    where: { id },
    select: { draftContent: true },
  })

  const existing = (current.draftContent ?? {}) as Record<string, unknown>

  const result = await prisma.caseStudy.updateMany({
    where: { id, draftVersion: expectedVersion },
    data: {
      // Sections and metrics are preserved: this editor owns the narrative
      // only, and clobbering the rest of the document would lose work.
      draftContent: {
        ...existing,
        narrative,
      } as unknown as Prisma.InputJsonValue,
      draftVersion: { increment: 1 },
    },
  })

  if (result.count === 0) throw new DraftConflictError()

  return expectedVersion + 1
}

export async function publishCaseStudy(
  id: string,
  adminId: string,
): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const study = await tx.caseStudy.findUniqueOrThrow({
      where: { id },
      select: { slug: true, draftContent: true },
    })

    await tx.caseStudy.update({
      where: { id },
      data: {
        publishedContent: study.draftContent as Prisma.InputJsonValue,
        publishedAt: new Date(),
        publishedBy: adminId,
      },
    })

    await tx.contentRevision.create({
      data: {
        entityType: 'caseStudy',
        entityId: id,
        content: study.draftContent as Prisma.InputJsonValue,
        action: 'published',
        createdBy: adminId,
      },
    })

    return { slug: study.slug }
  })
}

export async function unpublishCaseStudy(
  id: string,
  adminId: string,
): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const study = await tx.caseStudy.findUniqueOrThrow({
      where: { id },
      select: { slug: true, publishedContent: true },
    })

    await tx.caseStudy.update({
      where: { id },
      data: { publishedContent: Prisma.DbNull },
    })

    await tx.contentRevision.create({
      data: {
        entityType: 'caseStudy',
        entityId: id,
        content: (study.publishedContent ?? {}) as Prisma.InputJsonValue,
        action: 'unpublished',
        createdBy: adminId,
      },
    })

    return { slug: study.slug }
  })
}

/**
 * Deletes a study and its revisions. `ContentRevision` is polymorphic, so there
 * is no cascade to rely on — the cleanup is explicit and transactional.
 */
export async function deleteCaseStudy(id: string): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const study = await tx.caseStudy.findUniqueOrThrow({
      where: { id },
      select: { slug: true },
    })

    await tx.contentRevision.deleteMany({
      where: { entityType: 'caseStudy', entityId: id },
    })
    await tx.caseStudy.delete({ where: { id } })

    return { slug: study.slug }
  })
}

/** Applies an explicit order. Sent as the full list, so gaps cannot accumulate. */
export async function reorderCaseStudies(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.caseStudy.update({ where: { id }, data: { position: index } }),
    ),
  )
}
