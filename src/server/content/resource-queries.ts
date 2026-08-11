import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { prisma } from '@/db/prisma'
import { Prisma } from '@/generated/prisma/client'
import { requireAdmin } from '@/server/auth/dal'
import { cacheTags } from '@/server/cache/tags'

import { parseStoredPageContent, type PageContent } from './schemas/page'
import type { PageStatus } from './types'

/**
 * Resource (article) reads.
 *
 * Public reads are `'use cache'` + tagged + `cacheLife('max')`: an article
 * changes only when it is published, and publishing invalidates the tag
 * (ARCHITECTURE.md §4.1).
 *
 * ⚠️ Nothing in the cached functions may read `cookies()`, `headers()` or
 * `searchParams` — not even transitively. Admin reads are at the bottom of this
 * file and are deliberately uncached.
 */

export type ResourceSummary = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  coverId: string | null
  isFeatured: boolean
  publishedAt: string | null
}

export type PublishedResource = ResourceSummary & {
  content: PageContent
  seo: { title: string | null; description: string | null }
  isDraft: boolean
}

const SUMMARY_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  readTime: true,
  coverId: true,
  isFeatured: true,
  publishedAt: true,
} as const

type SummaryRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  coverId: string | null
  isFeatured: boolean
  publishedAt: Date | null
}

function toSummary(row: SummaryRow): ResourceSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    readTime: row.readTime,
    coverId: row.coverId,
    isFeatured: row.isFeatured,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }
}

export async function getPublishedResources(): Promise<ResourceSummary[]> {
  'use cache'
  cacheTag(cacheTags.resourcesIndex)
  cacheLife('max')

  const rows = await prisma.resource.findMany({
    where: { publishedContent: { not: Prisma.DbNull } },
    select: SUMMARY_SELECT,
    // Featured first, then the editor's order, then newest.
    orderBy: [{ isFeatured: 'desc' }, { position: 'asc' }, { publishedAt: 'desc' }],
  })

  return rows.map(toSummary)
}

export async function getPublishedResource(
  slug: string,
): Promise<PublishedResource | null> {
  'use cache'
  cacheTag(cacheTags.resource(slug))
  cacheLife('max')

  const row = await prisma.resource.findUnique({ where: { slug } })

  // publishedContent != null is the single source of truth for "is this live?"
  if (!row || row.publishedContent === null) return null

  return {
    ...toSummary(row),
    content: parseStoredPageContent(row.publishedContent, `resource:${slug}`),
    seo: { title: row.seoTitle, description: row.seoDescription },
    isDraft: false,
  }
}

export async function getPublishedResourceSlugs(): Promise<string[]> {
  'use cache'
  cacheTag(cacheTags.resourcesIndex)
  cacheLife('max')

  const rows = await prisma.resource.findMany({
    where: { publishedContent: { not: Prisma.DbNull } },
    select: { slug: true },
    orderBy: { slug: 'asc' },
  })

  return rows.map((row) => row.slug)
}

/**
 * Draft read for preview. Not cached and not admin-gated here — the preview
 * route enables Draft Mode only after verifying the shared secret and an admin
 * session, and Draft Mode bypasses `'use cache'` for the whole request anyway.
 */
export async function getDraftResource(
  slug: string,
): Promise<PublishedResource | null> {
  const row = await prisma.resource.findUnique({ where: { slug } })
  if (!row) return null

  return {
    ...toSummary(row),
    content: parseStoredPageContent(row.draftContent, `resource:${slug}`),
    seo: { title: row.seoTitle, description: row.seoDescription },
    isDraft: true,
  }
}

// ---------------------------------------------------------------------------
// Admin reads — never cached, these call requireAdmin() which reads cookies.
// ---------------------------------------------------------------------------

export type ResourceAdminSummary = ResourceSummary & {
  status: PageStatus
  updatedAt: string
}

export async function listResourcesForAdmin(): Promise<ResourceAdminSummary[]> {
  await requireAdmin()

  const rows = await prisma.resource.findMany({
    orderBy: [{ isFeatured: 'desc' }, { position: 'asc' }, { updatedAt: 'desc' }],
  })

  return rows.map((row) => ({
    ...toSummary(row),
    status: deriveStatus(row),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

function deriveStatus(row: {
  publishedContent: unknown
  publishedAt: Date | null
  updatedAt: Date
}): PageStatus {
  if (row.publishedContent === null) {
    return row.publishedAt ? 'UNPUBLISHED' : 'DRAFT'
  }

  return row.publishedAt && row.updatedAt.getTime() > row.publishedAt.getTime()
    ? 'LIVE_WITH_CHANGES'
    : 'LIVE'
}

export type ResourceForEdit = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  coverId: string | null
  isFeatured: boolean
  seoTitle: string
  seoDescription: string
  draftVersion: number
  draft: PageContent
  isLive: boolean
  hasUnpublishedChanges: boolean
  publishedAt: string | null
}

export async function getResourceForEdit(id: string): Promise<ResourceForEdit | null> {
  await requireAdmin()

  const row = await prisma.resource.findUnique({ where: { id } })
  if (!row) return null

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    readTime: row.readTime,
    coverId: row.coverId,
    isFeatured: row.isFeatured,
    seoTitle: row.seoTitle ?? '',
    seoDescription: row.seoDescription ?? '',
    draftVersion: row.draftVersion,
    draft: parseStoredPageContent(row.draftContent, `resource:${row.slug}`),
    isLive: row.publishedContent !== null,
    hasUnpublishedChanges: row.publishedAt
      ? row.updatedAt.getTime() > row.publishedAt.getTime()
      : row.publishedContent !== null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }
}
