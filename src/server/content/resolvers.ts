import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { prisma } from '@/db/prisma'
import { cacheTags } from '@/server/cache/tags'

import { toMediaAsset, toTestimonial } from './mappers'
import type { MediaAssetDto, TestimonialDto } from './types'

/**
 * Library entity resolvers.
 *
 * Sections store ids, not resolved copies (ADR-012). These functions turn those
 * ids into objects, each cached under its **own** tag — so editing one
 * testimonial invalidates that testimonial rather than every page displaying
 * it, and an alt-text fix goes live everywhere without republishing.
 *
 * On a cache hit a fully-rendered page still performs zero database reads;
 * these resolvers only run when something they depend on has changed.
 */

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

/**
 * Arguments form part of the cache key, so the id list is sorted first.
 * Without that, `['a','b']` and `['b','a']` would be two entries holding
 * identical data.
 */
function normalizeIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort()
}

export async function getMediaAssets(
  ids: readonly string[],
): Promise<Map<string, MediaAssetDto>> {
  const wanted = normalizeIds(ids)
  if (wanted.length === 0) return new Map()

  return getMediaAssetsByIds(wanted)
}

async function getMediaAssetsByIds(ids: string[]): Promise<Map<string, MediaAssetDto>> {
  'use cache'
  cacheTag(...ids.map((id) => cacheTags.media(id)))
  cacheLife('max')

  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: MEDIA_SELECT,
  })

  return new Map(assets.map((asset) => [asset.id, toMediaAsset(asset)]))
}

export async function getMediaAsset(id: string): Promise<MediaAssetDto | null> {
  const assets = await getMediaAssets([id])
  return assets.get(id) ?? null
}

export async function getTestimonials(
  ids: readonly string[],
): Promise<TestimonialDto[]> {
  const wanted = normalizeIds(ids)
  if (wanted.length === 0) return []

  const found = await getTestimonialsByIds(wanted)

  // Restore the editor's chosen order, which sorting destroyed.
  const byId = new Map(found.map((testimonial) => [testimonial.id, testimonial]))
  return ids
    .map((id) => byId.get(id))
    .filter((value): value is TestimonialDto => Boolean(value))
}

async function getTestimonialsByIds(ids: string[]): Promise<TestimonialDto[]> {
  'use cache'
  cacheTag(...ids.map((id) => cacheTags.testimonial(id)))
  cacheLife('max')

  const testimonials = await prisma.testimonial.findMany({
    where: { id: { in: ids }, isPublished: true },
    select: {
      id: true,
      quote: true,
      authorName: true,
      authorRole: true,
      companyName: true,
      companyLogoId: true,
      avatarId: true,
      caseStudyId: true,
    },
  })

  return testimonials.map(toTestimonial)
}

/** All published testimonials, for sections that show the full set. */
export async function getAllTestimonials(): Promise<TestimonialDto[]> {
  'use cache'
  cacheTag(cacheTags.testimonialsIndex)
  cacheLife('max')

  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      quote: true,
      authorName: true,
      authorRole: true,
      companyName: true,
      companyLogoId: true,
      avatarId: true,
      caseStudyId: true,
    },
  })

  return testimonials.map(toTestimonial)
}
