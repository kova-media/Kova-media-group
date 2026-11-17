import 'server-only'

import { prisma } from '@/db/prisma'
import { Prisma } from '@/generated/prisma/client'
import { requireAdmin } from '@/server/auth/dal'

import {
  hasUnpublishedChanges,
  toCaseStudyAdminSummary,
  toPageSummary,
  toPublishedCaseStudy,
  toPublishedPage,
} from './mappers'
import type {
  CaseStudyAdminSummary,
  PageSummary,
  PublishedCaseStudy,
  PublishedPage,
} from './types'

/**
 * Admin reads. **Never cached.**
 *
 * Kept in a separate module from queries.ts deliberately: these call
 * `requireAdmin()`, which reads cookies, and reading request state inside a
 * `'use cache'` scope is a runtime error. Keeping the two apart makes the
 * mistake hard to make and obvious in review (FOLDER_STRUCTURE.md §5).
 */

const PAGE_SELECT = {
  id: true,
  slug: true,
  title: true,
  seoTitle: true,
  seoDescription: true,
  seoImageId: true,
  seoNoIndex: true,
  publishedContent: true,
  draftContent: true,
  publishedAt: true,
} as const

export async function listPages(): Promise<PageSummary[]> {
  await requireAdmin()

  const pages = await prisma.page.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      isSystem: true,
      draftContent: true,
      publishedContent: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ isSystem: 'desc' }, { title: 'asc' }],
  })

  return pages.map(toPageSummary)
}

export type PageForEdit = {
  id: string
  slug: string
  title: string
  isSystem: boolean
  draftVersion: number
  seoTitle: string
  seoDescription: string
  seoImageId: string | null
  seoNoIndex: boolean
  draft: PublishedPage
  hasUnpublishedChanges: boolean
  isLive: boolean
  publishedAt: string | null
}

export async function getPageForEdit(id: string): Promise<PageForEdit | null> {
  await requireAdmin()

  const page = await prisma.page.findUnique({
    where: { id },
    select: {
      ...PAGE_SELECT,
      isSystem: true,
      draftVersion: true,
      updatedAt: true,
    },
  })

  if (!page) return null

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    isSystem: page.isSystem,
    draftVersion: page.draftVersion,
    seoTitle: page.seoTitle ?? '',
    seoDescription: page.seoDescription ?? '',
    seoImageId: page.seoImageId,
    seoNoIndex: page.seoNoIndex,
    draft: toPublishedPage(page, 'draft'),
    isLive: page.publishedContent !== null,
    hasUnpublishedChanges: hasUnpublishedChanges(
      page.draftContent,
      page.publishedContent,
    ),
    publishedAt: page.publishedAt?.toISOString() ?? null,
  }
}

/**
 * Draft read for preview.
 *
 * Not cached and not admin-gated here — the preview route enables Draft Mode
 * only after verifying both the shared secret and an admin session, and Draft
 * Mode bypasses `'use cache'` for the whole request anyway.
 */
export async function getDraftPage(slug: string): Promise<PublishedPage | null> {
  const page = await prisma.page.findUnique({
    where: { slug },
    select: PAGE_SELECT,
  })

  if (!page) return null

  return toPublishedPage(page, 'draft')
}

export async function getDraftCaseStudy(
  slug: string,
): Promise<PublishedCaseStudy | null> {
  const caseStudy = await prisma.caseStudy.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      clientName: true,
      clientLogoId: true,
      headline: true,
      summary: true,
      industry: true,
      isFeatured: true,
      heroImageId: true,
      seoTitle: true,
      seoDescription: true,
      publishedContent: true,
      draftContent: true,
      publishedAt: true,
    },
  })

  if (!caseStudy) return null

  return toPublishedCaseStudy(caseStudy, 'draft')
}

export async function listCaseStudies(): Promise<CaseStudyAdminSummary[]> {
  await requireAdmin()

  const caseStudies = await prisma.caseStudy.findMany({
    select: {
      id: true,
      slug: true,
      clientName: true,
      headline: true,
      isFeatured: true,
      position: true,
      draftContent: true,
      publishedContent: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ isFeatured: 'desc' }, { position: 'asc' }, { updatedAt: 'desc' }],
  })

  return caseStudies.map(toCaseStudyAdminSummary)
}

/** Dashboard counters. One round trip rather than four sequential ones. */
export async function getDashboardStats() {
  await requireAdmin()

  const [newSubmissions, unnotified, pages, liveCaseStudies, mediaCount] =
    await Promise.all([
      prisma.contactSubmission.count({ where: { status: 'NEW' } }),
      prisma.contactSubmission.count({ where: { notifiedAt: null } }),
      prisma.page.findMany({
        select: {
          draftContent: true,
          publishedContent: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
      prisma.caseStudy.count({ where: { publishedContent: { not: Prisma.DbNull } } }),
      prisma.mediaAsset.count({ where: { deletedAt: null } }),
    ])

  const pagesWithChanges = pages.filter((page) =>
    hasUnpublishedChanges(page.draftContent, page.publishedContent),
  ).length

  return {
    newSubmissions,
    unnotifiedSubmissions: unnotified,
    totalPages: pages.length,
    livePages: pages.filter((page) => page.publishedContent !== null).length,
    pagesWithUnpublishedChanges: pagesWithChanges,
    liveCaseStudies,
    mediaCount,
  }
}

export type RecentRevision = {
  id: string
  entityType: 'page' | 'caseStudy'
  entityId: string
  title: string
  action: string
  createdAt: Date
}

/**
 * Latest publish history for the dashboard's Recent activity panel.
 * ContentRevision is append-only — one row per publish or unpublish — and
 * carries no title, so titles are resolved from the page or case study the
 * revision belongs to. A revision whose item has since been deleted falls
 * back to its type name.
 */
export async function getRecentRevisions(limit = 8): Promise<RecentRevision[]> {
  await requireAdmin()

  const revisions = await prisma.contentRevision.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      action: true,
      createdAt: true,
    },
  })

  const pageIds = [
    ...new Set(
      revisions
        .filter((revision) => revision.entityType === 'page')
        .map((revision) => revision.entityId),
    ),
  ]
  const caseStudyIds = [
    ...new Set(
      revisions
        .filter((revision) => revision.entityType === 'caseStudy')
        .map((revision) => revision.entityId),
    ),
  ]

  const [pages, caseStudies] = await Promise.all([
    pageIds.length > 0
      ? prisma.page.findMany({
          where: { id: { in: pageIds } },
          select: { id: true, title: true },
        })
      : [],
    caseStudyIds.length > 0
      ? prisma.caseStudy.findMany({
          where: { id: { in: caseStudyIds } },
          select: { id: true, title: true },
        })
      : [],
  ])

  const titles = new Map<string, string>()
  for (const page of pages) {
    titles.set(`page:${page.id}`, page.title)
  }
  for (const study of caseStudies) {
    titles.set(`caseStudy:${study.id}`, study.title)
  }

  return revisions.map((revision) => {
    const entityType = revision.entityType === 'caseStudy' ? 'caseStudy' : 'page'
    return {
      id: revision.id,
      entityType,
      entityId: revision.entityId,
      title:
        titles.get(`${revision.entityType}:${revision.entityId}`) ??
        (entityType === 'caseStudy' ? 'Case study' : 'Page'),
      action: revision.action,
      createdAt: revision.createdAt,
    }
  })
}
