import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { env } from '@/env'

export const MEDIA_BUCKET = 'media'

/** Server-side MIME allowlist (CMS.md §7.6). */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'application/pdf',
] as const

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export function isAllowedMimeType(value: string): value is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(value)
}

/**
 * Storage client using the service role key.
 *
 * Server-only, never logged, and never reachable from a Client Component —
 * `import 'server-only'` above makes an accidental client import a build error.
 */
function storageClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * `YYYY/MM/<uuid>-<slug>.<ext>` — collision-free but still readable when
 * debugging. Paths are stable; an object is never renamed after upload.
 */
export function buildStoragePath(filename: string, uuid: string): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')

  const lastDot = filename.lastIndexOf('.')
  const base = lastDot > 0 ? filename.slice(0, lastDot) : filename
  const ext = lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : 'bin'

  const slug =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'file'

  return `${year}/${month}/${uuid}-${slug}.${ext.replace(/[^a-z0-9]/g, '')}`
}

/**
 * Signed URL the browser uploads to directly.
 *
 * Bytes never transit our functions — Vercel's request body limit makes
 * proxying multi-megabyte images unreliable (ADR-011).
 */
export async function createSignedUpload(storagePath: string) {
  const supabase = storageClient()
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(storagePath)

  if (error || !data) {
    throw new Error(`Could not create upload URL: ${error?.message ?? 'unknown error'}`)
  }

  return { signedUrl: data.signedUrl, token: data.token, path: storagePath }
}

export async function downloadObject(storagePath: string): Promise<Buffer> {
  const supabase = storageClient()
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .download(storagePath)

  if (error || !data) {
    throw new Error(`Could not read uploaded file: ${error?.message ?? 'not found'}`)
  }

  return Buffer.from(await data.arrayBuffer())
}

export async function uploadObject(
  storagePath: string,
  body: Buffer,
  contentType: string,
) {
  const supabase = storageClient()
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, body, { contentType, upsert: true })

  if (error) {
    throw new Error(`Could not write file: ${error.message}`)
  }
}

export async function removeObject(storagePath: string) {
  const supabase = storageClient()
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([storagePath])

  if (error) {
    throw new Error(`Could not delete file: ${error.message}`)
  }
}

export function publicUrl(storagePath: string): string {
  const supabase = storageClient()
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/** Objects with no MediaAsset row, for the orphan reconciliation job. */
export async function listObjects(prefix: string) {
  const supabase = storageClient()
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(prefix, {
    limit: 1000,
  })

  if (error) throw new Error(`Could not list files: ${error.message}`)

  return data ?? []
}
