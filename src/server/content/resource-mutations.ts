import 'server-only'

import { prisma } from '@/db/prisma'
import { Prisma } from '@/generated/prisma/client'

import { DraftConflictError } from './mutations'
import type { PageContent } from './schemas/page'

/**
 * Resource writes. Mirrors `mutations.ts` for pages — an article is a page with
 * a few extra list-facing columns, so it reuses the same document model, the
 * same optimistic-concurrency guard, and the same revision trail.
 */

export type ResourceFields = {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  coverId: string | null
  isFeatured: boolean
  seoTitle: string | null
  seoDescription: string | null
}

export async function createResource(input: {
  slug: string
  title: string
  category: string
}): Promise<{ id: string }> {
  const last = await prisma.resource.findFirst({
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  return prisma.resource.create({
    data: {
      slug: input.slug,
      title: input.title,
      category: input.category,
      excerpt: '',
      readTime: '5 min read',
      position: (last?.position ?? -1) + 1,
      draftContent: { sections: [] },
    },
    select: { id: true },
  })
}

export async function updateResourceFields(
  id: string,
  fields: ResourceFields,
): Promise<{ previousSlug: string; slug: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.resource.findUniqueOrThrow({
      where: { id },
      select: { slug: true },
    })

    await tx.resource.update({ where: { id }, data: fields })

    return { previousSlug: existing.slug, slug: fields.slug }
  })
}

/**
 * Saves the draft document, guarding against a stale tab. The version is part
 * of the WHERE clause rather than a read-then-check, so two concurrent saves
 * cannot both pass the check before either writes.
 */
export async function saveResourceDraft(
  id: string,
  content: PageContent,
  expectedVersion: number,
): Promise<number> {
  const result = await prisma.resource.updateMany({
    where: { id, draftVersion: expectedVersion },
    data: {
      draftContent: content as unknown as Prisma.InputJsonValue,
      draftVersion: { increment: 1 },
    },
  })

  if (result.count === 0) throw new DraftConflictError()

  return expectedVersion + 1
}

export async function publishResource(
  id: string,
  adminId: string,
): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.resource.findUniqueOrThrow({
      where: { id },
      select: { slug: true, draftContent: true },
    })

    await tx.resource.update({
      where: { id },
      data: {
        publishedContent: row.draftContent as Prisma.InputJsonValue,
        publishedAt: new Date(),
        publishedBy: adminId,
      },
    })

    await tx.contentRevision.create({
      data: {
        entityType: 'resource',
        entityId: id,
        content: row.draftContent as Prisma.InputJsonValue,
        action: 'published',
        createdBy: adminId,
      },
    })

    return { slug: row.slug }
  })
}

export async function unpublishResource(
  id: string,
  adminId: string,
): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.resource.findUniqueOrThrow({
      where: { id },
      select: { slug: true, publishedContent: true },
    })

    await tx.resource.update({
      where: { id },
      data: { publishedContent: Prisma.DbNull },
    })

    await tx.contentRevision.create({
      data: {
        entityType: 'resource',
        entityId: id,
        content: (row.publishedContent ?? {}) as Prisma.InputJsonValue,
        action: 'unpublished',
        createdBy: adminId,
      },
    })

    return { slug: row.slug }
  })
}

/**
 * Deletes an article and its revisions. `ContentRevision` is polymorphic, so
 * there is no cascade to rely on — the cleanup is explicit and transactional.
 */
export async function deleteResource(id: string): Promise<{ slug: string }> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.resource.findUniqueOrThrow({
      where: { id },
      select: { slug: true },
    })

    await tx.contentRevision.deleteMany({
      where: { entityType: 'resource', entityId: id },
    })
    await tx.resource.delete({ where: { id } })

    return { slug: row.slug }
  })
}

export async function reorderResources(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.resource.update({ where: { id }, data: { position: index } }),
    ),
  )
}
