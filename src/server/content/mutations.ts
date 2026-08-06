import 'server-only'

// Value import, not type-only: `Prisma.DbNull` is a runtime sentinel used to
// write SQL NULL into a JSON column (as opposed to the JSON value `null`).
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/prisma'

import type { PageContent } from './schemas/page'

/**
 * Write helpers. Authorization and cache invalidation happen in the calling
 * Server Action; this module owns the database work only.
 */

export class DraftConflictError extends Error {
  constructor() {
    super('This page was changed in another tab.')
    this.name = 'DraftConflictError'
  }
}

/**
 * Saves the draft document, guarding against a stale tab.
 *
 * The version is part of the WHERE clause rather than a read-then-check, so two
 * concurrent saves cannot both pass the check before either writes. A zero-row
 * update means someone else got there first.
 */
export async function saveDraftContent(
  pageId: string,
  content: PageContent,
  expectedVersion: number,
): Promise<number> {
  const result = await prisma.page.updateMany({
    where: { id: pageId, draftVersion: expectedVersion },
    data: {
      draftContent: content as unknown as Prisma.InputJsonValue,
      draftVersion: { increment: 1 },
    },
  })

  if (result.count === 0) {
    throw new DraftConflictError()
  }

  return expectedVersion + 1
}

export async function publishPageContent(
  pageId: string,
  content: PageContent,
  adminId: string,
): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const page = await tx.page.update({
      where: { id: pageId },
      data: {
        publishedContent: content as unknown as Prisma.InputJsonValue,
        publishedAt: new Date(),
        publishedBy: adminId,
      },
      select: { slug: true },
    })

    await tx.contentRevision.create({
      data: {
        entityType: 'page',
        entityId: pageId,
        content: content as unknown as Prisma.InputJsonValue,
        action: 'published',
        createdBy: adminId,
      },
    })

    return page
  })
}

export async function unpublishPageContent(
  pageId: string,
  adminId: string,
): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.page.findUniqueOrThrow({
      where: { id: pageId },
      select: { slug: true, publishedContent: true },
    })

    await tx.page.update({
      where: { id: pageId },
      data: { publishedContent: Prisma.DbNull },
    })

    await tx.contentRevision.create({
      data: {
        entityType: 'page',
        entityId: pageId,
        content: (existing.publishedContent ?? {}) as Prisma.InputJsonValue,
        action: 'unpublished',
        createdBy: adminId,
      },
    })

    return { slug: existing.slug }
  })
}

export async function createPage(input: {
  slug: string
  title: string
}): Promise<{ id: string }> {
  return prisma.page.create({
    data: {
      slug: input.slug,
      title: input.title,
      draftContent: { sections: [] },
    },
    select: { id: true },
  })
}

/**
 * Deletes a page and its revisions. `ContentRevision` is polymorphic, so there
 * is no cascade to rely on — the cleanup is explicit and transactional.
 */
export async function deletePage(pageId: string): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const page = await tx.page.findUniqueOrThrow({
      where: { id: pageId },
      select: { slug: true, isSystem: true },
    })

    if (page.isSystem) {
      throw new Error('System pages cannot be deleted.')
    }

    await tx.contentRevision.deleteMany({
      where: { entityType: 'page', entityId: pageId },
    })
    await tx.page.delete({ where: { id: pageId } })

    return { slug: page.slug }
  })
}

export async function updatePageSettings(
  pageId: string,
  input: {
    title: string
    slug: string
    seoTitle: string | null
    seoDescription: string | null
    seoImageId: string | null
    seoNoIndex: boolean
  },
): Promise<{ previousSlug: string; slug: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.page.findUniqueOrThrow({
      where: { id: pageId },
      select: { slug: true, isSystem: true },
    })

    // A system page's slug is wired into a real route file; changing it would
    // silently 404 that route.
    const slug = existing.isSystem ? existing.slug : input.slug

    await tx.page.update({
      where: { id: pageId },
      data: {
        title: input.title,
        slug,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImageId: input.seoImageId,
        seoNoIndex: input.seoNoIndex,
      },
    })

    return { previousSlug: existing.slug, slug }
  })
}
