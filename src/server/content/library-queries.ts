import 'server-only'

import { prisma } from '@/db/prisma'
import { requireAdmin } from '@/server/auth/dal'
import { toMediaAsset } from '@/server/content/mappers'
import type { MediaAssetDto } from '@/server/content/types'

/** Admin library reads. Uncached — these read cookies via `requireAdmin()`. */

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

export type TestimonialAdminRow = {
  id: string
  quote: string
  authorName: string
  authorRole: string | null
  companyName: string
  avatarId: string | null
  companyLogoId: string | null
  isPublished: boolean
  position: number
  avatar: MediaAssetDto | null
}

export async function listTestimonialsForAdmin(): Promise<TestimonialAdminRow[]> {
  await requireAdmin()

  const rows = await prisma.testimonial.findMany({ orderBy: { position: 'asc' } })

  const avatarIds = rows
    .map((row) => row.avatarId)
    .filter((id): id is string => Boolean(id))

  const avatars = avatarIds.length
    ? await prisma.mediaAsset.findMany({
        where: { id: { in: avatarIds }, deletedAt: null },
        select: MEDIA_SELECT,
      })
    : []

  const byId = new Map(avatars.map((asset) => [asset.id, toMediaAsset(asset)]))

  return rows.map((row) => ({
    id: row.id,
    quote: row.quote,
    authorName: row.authorName,
    authorRole: row.authorRole,
    companyName: row.companyName,
    avatarId: row.avatarId,
    companyLogoId: row.companyLogoId,
    isPublished: row.isPublished,
    position: row.position,
    avatar: row.avatarId ? (byId.get(row.avatarId) ?? null) : null,
  }))
}

export type PartnerLogoAdminRow = {
  id: string
  name: string
  mediaId: string
  href: string | null
  isPublished: boolean
  position: number
  media: MediaAssetDto | null
}

export async function listPartnerLogosForAdmin(): Promise<PartnerLogoAdminRow[]> {
  await requireAdmin()

  const rows = await prisma.partnerLogo.findMany({ orderBy: { position: 'asc' } })

  const assets = rows.length
    ? await prisma.mediaAsset.findMany({
        where: { id: { in: rows.map((row) => row.mediaId) }, deletedAt: null },
        select: MEDIA_SELECT,
      })
    : []

  const byId = new Map(assets.map((asset) => [asset.id, toMediaAsset(asset)]))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mediaId: row.mediaId,
    href: row.href,
    isPublished: row.isPublished,
    position: row.position,
    media: byId.get(row.mediaId) ?? null,
  }))
}
