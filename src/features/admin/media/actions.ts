'use server'

import { randomUUID } from 'node:crypto'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/db/prisma'
import { logger } from '@/lib/logger'
import {
  fail,
  ok,
  parseInput,
  unexpected,
  type ActionResult,
} from '@/server/actions/result'
import { requireAdmin } from '@/server/auth/dal'
import { cacheTags } from '@/server/cache/tags'
import { toMediaAsset } from '@/server/content/mappers'
import type { MediaAssetDto } from '@/server/content/types'
import {
  extractImageMetadata,
  readSvgDimensions,
  sanitizeSvg,
} from '@/server/media/process'
import {
  findMediaUsage,
  listMedia,
  type MediaListResult,
  type MediaUsage,
} from '@/server/media/queries'
import {
  MAX_UPLOAD_BYTES,
  buildStoragePath,
  createSignedUpload,
  downloadObject,
  isAllowedMimeType,
  publicUrl,
  removeObject,
  uploadObject,
} from '@/server/media/storage'

/**
 * Media library actions.
 *
 * Upload is three steps (ADR-011): request a signed URL, upload straight to
 * Supabase Storage, then record metadata derived server-side. Bytes never pass
 * through our functions, and nothing the client claims about the file is
 * trusted.
 */

const requestUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  byteSize: z.number().int().positive(),
})

export type UploadTicket = {
  signedUrl: string
  token: string
  storagePath: string
}

export async function requestUpload(
  input: unknown,
): Promise<ActionResult<UploadTicket>> {
  await requireAdmin()

  const parsed = parseInput(requestUploadSchema, input)
  if (!parsed.ok) return parsed.result

  const { filename, mimeType, byteSize } = parsed.data

  if (!isAllowedMimeType(mimeType)) {
    return fail(`${mimeType} files are not supported.`)
  }

  if (byteSize > MAX_UPLOAD_BYTES) {
    return fail(
      `That file is larger than the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit.`,
    )
  }

  try {
    const storagePath = buildStoragePath(filename, randomUUID())
    const ticket = await createSignedUpload(storagePath)

    return ok({
      signedUrl: ticket.signedUrl,
      token: ticket.token,
      storagePath: ticket.path,
    })
  } catch (error) {
    return unexpected('requestUpload', error)
  }
}

const finalizeSchema = z.object({
  storagePath: z.string().min(1),
  filename: z.string().min(1).max(255),
  folder: z.string().max(80).nullable().optional(),
})

/**
 * Step 3: read the object back, derive real metadata, record the asset.
 *
 * Everything the client said about the file is re-checked here. A file claiming
 * to be a PNG that is not one is deleted rather than recorded.
 */
export async function finalizeUpload(
  input: unknown,
): Promise<ActionResult<MediaAssetDto>> {
  const admin = await requireAdmin()

  const parsed = parseInput(finalizeSchema, input)
  if (!parsed.ok) return parsed.result

  const { storagePath, filename, folder } = parsed.data

  try {
    let buffer = await downloadObject(storagePath)

    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      await removeObject(storagePath)
      return fail('That file is larger than the upload limit.')
    }

    const isSvg = storagePath.toLowerCase().endsWith('.svg')
    let width: number | null = null
    let height: number | null = null
    let blurDataURL: string | null = null
    let mimeType: string

    if (isSvg) {
      // Executable content — sanitise and rewrite the stored object before it
      // can ever be served from our origin.
      const sanitized = sanitizeSvg(buffer)
      if (!sanitized.equals(buffer)) {
        await uploadObject(storagePath, sanitized, 'image/svg+xml')
        logger.info('Sanitised SVG on upload', { storagePath })
        buffer = sanitized
      }

      const dimensions = readSvgDimensions(buffer)
      width = dimensions.width
      height = dimensions.height
      mimeType = 'image/svg+xml'
    } else if (storagePath.toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf'
    } else {
      const metadata = await extractImageMetadata(buffer)

      if (!metadata.detectedMimeType) {
        await removeObject(storagePath)
        return fail('That file could not be read as an image.')
      }

      if (!isAllowedMimeType(metadata.detectedMimeType)) {
        await removeObject(storagePath)
        return fail('That file type is not supported.')
      }

      width = metadata.width
      height = metadata.height
      blurDataURL = metadata.blurDataURL
      mimeType = metadata.detectedMimeType
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        storagePath,
        url: publicUrl(storagePath),
        filename,
        mimeType,
        byteSize: buffer.byteLength,
        width,
        height,
        blurDataURL,
        folder: folder || null,
        uploadedBy: admin.adminId,
      },
      select: {
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
      },
    })

    updateTag(cacheTags.mediaIndex)

    return ok(toMediaAsset(asset))
  } catch (error) {
    return unexpected('finalizeUpload', error, { storagePath })
  }
}

const updateMediaSchema = z.object({
  id: z.string().min(1),
  alt: z.string().max(300),
  caption: z.string().max(500).nullable(),
  folder: z.string().max(80).nullable(),
})

export async function updateMedia(input: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(updateMediaSchema, input)
  if (!parsed.ok) return parsed.result

  try {
    await prisma.mediaAsset.update({
      where: { id: parsed.data.id },
      data: {
        alt: parsed.data.alt,
        caption: parsed.data.caption || null,
        folder: parsed.data.folder || null,
      },
    })

    // Per-asset tag: an alt-text fix goes live on every page using it, with no
    // republish, and without invalidating anything else (ADR-012).
    updateTag(cacheTags.media(parsed.data.id))
    updateTag(cacheTags.mediaIndex)

    return ok()
  } catch (error) {
    return unexpected('updateMedia', error, { mediaId: parsed.data.id })
  }
}

const mediaIdSchema = z.object({ id: z.string().min(1) })

/** Soft delete. Hides the asset from the picker; existing references keep working. */
export async function archiveMedia(input: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(mediaIdSchema, input)
  if (!parsed.ok) return parsed.result

  try {
    const usage = await findMediaUsage(parsed.data.id)
    const live = usage.filter((entry) => entry.isLive)

    // A broken image on a published page is not a recoverable mistake for a
    // site whose job is to look expensive (CMS.md §7.4).
    if (live.length > 0) {
      return fail(
        `This image is used on ${live.length} published page${
          live.length === 1 ? '' : 's'
        }. Remove it there first.`,
      )
    }

    await prisma.mediaAsset.update({
      where: { id: parsed.data.id },
      data: { deletedAt: new Date() },
    })

    updateTag(cacheTags.media(parsed.data.id))
    updateTag(cacheTags.mediaIndex)

    return ok()
  } catch (error) {
    return unexpected('archiveMedia', error)
  }
}

/** Read-through wrappers so client components can call the DAL. */
export async function fetchMedia(input: {
  search?: string
  folder?: string
  take?: number
  skip?: number
}): Promise<MediaListResult> {
  return listMedia(input)
}

export async function fetchMediaUsage(mediaId: string): Promise<MediaUsage[]> {
  return findMediaUsage(mediaId)
}
