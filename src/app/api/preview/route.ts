import { timingSafeEqual } from 'node:crypto'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { env } from '@/env'
import { logger } from '@/lib/logger'
import { getAdminSession } from '@/server/auth/dal'
import { resolvePreviewTarget } from '@/server/content/preview'

/**
 * Draft Mode entry (CMS.md §5).
 *
 * GET because the CMS opens this in a new tab, which is inherently a GET.
 * Guarded by BOTH an admin session and a shared secret — either alone would be
 * weaker than it looks, since the resulting `__prerender_bypass` cookie is a
 * capability that reveals unpublished content.
 */
function secretMatches(provided: string | null): boolean {
  if (!provided) return false

  const a = Buffer.from(provided)
  const b = Buffer.from(env.PREVIEW_SECRET)

  // timingSafeEqual throws on length mismatch, so compare lengths first.
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const slug = searchParams.get('slug')
  const type = searchParams.get('type') ?? 'page'
  const secret = searchParams.get('secret')

  // An authenticated admin does not need the secret; an external caller does.
  const session = await getAdminSession()

  if (!session && !secretMatches(secret)) {
    logger.warn('Rejected preview request')
    return new Response('Not authorised', { status: 401 })
  }

  if (!slug) {
    return new Response('Missing slug', { status: 400 })
  }

  // Resolved from the database rather than trusted from the query string.
  // Redirecting to a raw parameter would be an open redirect.
  const target = await resolvePreviewTarget(type, slug)

  if (!target) {
    return new Response('Unknown content', { status: 404 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(target.path)
}
