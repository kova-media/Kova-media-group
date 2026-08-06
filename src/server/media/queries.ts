import 'server-only'

import { prisma } from '@/db/prisma'
import { requireAdmin } from '@/server/auth/dal'
import { toMediaAsset } from '@/server/content/mappers'
import type { MediaAssetDto } from '@/server/content/types'

/** Admin media reads. Uncached — these read cookies via requireAdmin(). */

const MEDIA_SELECT = {
  id: true,
  url: true,
  alt: true,
  caption: true,
  width: true,
  height: true,
  blurDataURL: true,
  mimeType: true,
  filename: true,
  byteSize: true,
  folder: true,
  createdAt: true,
} as const

export type MediaListResult = {
  items: MediaAssetDto[]
  total: number
  folders: string[]
}

export async function listMedia(options?: {
  search?: string
  folder?: string
  take?: number
  skip?: number
}): Promise<MediaListResult> {
  await requireAdmin()

  const take = Math.min(options?.take ?? 60, 200)
  const skip = options?.skip ?? 0
  const search = options?.search?.trim()

  const where = {
    deletedAt: null,
    ...(options?.folder ? { folder: options.folder } : {}),
    ...(search
      ? {
          OR: [
            { filename: { contains: search, mode: 'insensitive' as const } },
            { alt: { contains: search, mode: 'insensitive' as const } },
            { caption: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [items, total, folderRows] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      select: MEDIA_SELECT,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({
      where: { deletedAt: null, folder: { not: null } },
      select: { folder: true },
      distinct: ['folder'],
    }),
  ])

  return {
    items: items.map(toMediaAsset),
    total,
    folders: folderRows
      .map((row) => row.folder)
      .filter((folder): folder is string => Boolean(folder))
      .sort(),
  }
}

export async function getMediaForAdmin(id: string): Promise<MediaAssetDto | null> {
  await requireAdmin()

  const asset = await prisma.mediaAsset.findFirst({
    where: { id, deletedAt: null },
    select: MEDIA_SELECT,
  })

  return asset ? toMediaAsset(asset) : null
}

/** Assets referenced by a set of ids, for hydrating an editor. */
export async function getMediaByIdsForAdmin(
  ids: readonly string[],
): Promise<MediaAssetDto[]> {
  await requireAdmin()

  if (ids.length === 0) return []

  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: [...ids] }, deletedAt: null },
    select: MEDIA_SELECT,
  })

  return assets.map(toMediaAsset)
}

export type MediaUsage = {
  entityType: 'page' | 'caseStudy'
  id: string
  title: string
  slug: string
  isLive: boolean
}

/**
 * Where an asset is used.
 *
 * A scan of every page and case study — correct at our content volume (well
 * under a hundred rows), and cheaper to maintain than a usage table that has to
 * stay in sync with every document write (ADR-012).
 */
export async function findMediaUsage(mediaId: string): Promise<MediaUsage[]> {
  await requireAdmin()

  const [pages, caseStudies] = await Promise.all([
    prisma.page.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        draftContent: true,
        publishedContent: true,
      },
    }),
    prisma.caseStudy.findMany({
      select: {
        id: true,
        headline: true,
        slug: true,
        draftContent: true,
        publishedContent: true,
        heroImageId: true,
        clientLogoId: true,
      },
    }),
  ])

  const usage: MediaUsage[] = []
  const mentions = (value: unknown) =>
    value !== null && value !== undefined && JSON.stringify(value).includes(mediaId)

  for (const page of pages) {
    if (mentions(page.draftContent) || mentions(page.publishedContent)) {
      usage.push({
        entityType: 'page',
        id: page.id,
        title: page.title,
        slug: page.slug,
        isLive: mentions(page.publishedContent),
      })
    }
  }

  for (const study of caseStudies) {
    const referenced =
      mentions(study.draftContent) ||
      mentions(study.publishedContent) ||
      study.heroImageId === mediaId ||
      study.clientLogoId === mediaId

    if (referenced) {
      usage.push({
        entityType: 'caseStudy',
        id: study.id,
        title: study.headline,
        slug: study.slug,
        isLive: mentions(study.publishedContent),
      })
    }
  }

  return usage
}
