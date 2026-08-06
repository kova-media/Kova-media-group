import 'server-only'

import sharp from 'sharp'

import { logger } from '@/lib/logger'

/**
 * Server-side image processing.
 *
 * Dimensions and MIME type are **derived here, never trusted from the client**
 * (ADR-011): EXIF rotation makes browser-reported dimensions wrong, and a
 * client-declared content type is trivially spoofed.
 */

export type ImageMetadata = {
  width: number | null
  height: number | null
  blurDataURL: string | null
  detectedMimeType: string | null
}

const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

/**
 * A tiny blurred WebP, inlined as a data URI for `next/image`'s `placeholder`.
 * 16px wide keeps it well under a kilobyte, which matters because it ships
 * inside the HTML.
 */
async function buildBlurPlaceholder(input: Buffer): Promise<string | null> {
  try {
    const buffer = await sharp(input)
      .resize(16, 16, { fit: 'inside' })
      .webp({ quality: 40 })
      .toBuffer()

    return `data:image/webp;base64,${buffer.toString('base64')}`
  } catch (error) {
    logger.warn('Could not build blur placeholder', { error })
    return null
  }
}

export async function extractImageMetadata(input: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(input).metadata()

    // `autoOrient` accounts for EXIF rotation, so a portrait photo does not
    // report landscape dimensions and cause a layout shift.
    const oriented = await sharp(input).autoOrient().metadata()

    const width = oriented.width ?? metadata.width ?? null
    const height = oriented.height ?? metadata.height ?? null
    const detectedMimeType = metadata.format
      ? (FORMAT_TO_MIME[metadata.format] ?? null)
      : null

    return {
      width,
      height,
      blurDataURL: await buildBlurPlaceholder(input),
      detectedMimeType,
    }
  } catch (error) {
    logger.warn('Could not read image metadata', { error })
    return { width: null, height: null, blurDataURL: null, detectedMimeType: null }
  }
}

/**
 * Strips scripts, event handlers and external references from an SVG.
 *
 * SVG is executable content. Serving an unsanitised one from our own origin
 * would hand an attacker same-origin script execution, which is exactly what
 * ADR-013's public CSP reasoning assumes cannot happen.
 */
export function sanitizeSvg(input: Buffer): Buffer {
  let svg = input.toString('utf8')

  svg = svg.replace(/<script[\s\S]*?<\/script\s*>/gi, '')
  svg = svg.replace(/<script[^>]*\/>/gi, '')
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
  // on* event handlers, quoted or bare
  svg = svg.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  svg = svg.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  svg = svg.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
  // javascript:/data: in href/xlink:href
  svg = svg.replace(
    /((?:xlink:)?href)\s*=\s*("|')\s*(?:javascript|data):[^"']*\2/gi,
    '$1=$2#$2',
  )
  svg = svg.replace(/<!ENTITY[\s\S]*?>/gi, '')
  svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, '')

  return Buffer.from(svg, 'utf8')
}

/** Rough dimensions from an SVG's width/height or viewBox. */
export function readSvgDimensions(input: Buffer): {
  width: number | null
  height: number | null
} {
  const svg = input.toString('utf8').slice(0, 2000)

  const width = /\bwidth\s*=\s*["']?([\d.]+)/i.exec(svg)
  const height = /\bheight\s*=\s*["']?([\d.]+)/i.exec(svg)

  if (width?.[1] && height?.[1]) {
    return {
      width: Math.round(Number(width[1])),
      height: Math.round(Number(height[1])),
    }
  }

  const viewBox = /viewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/i.exec(
    svg,
  )

  if (viewBox?.[1] && viewBox[2]) {
    return {
      width: Math.round(Number(viewBox[1])),
      height: Math.round(Number(viewBox[2])),
    }
  }

  return { width: null, height: null }
}
