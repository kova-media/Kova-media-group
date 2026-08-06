import 'server-only'

import { redirect } from 'next/navigation'
import { cache } from 'react'

import { prisma } from '@/db/prisma'
import { logger } from '@/lib/logger'

import { createServerSupabaseClient } from './supabase'

/**
 * The authorization boundary (ARCHITECTURE.md §7).
 *
 * `proxy.ts` performs an optimistic redirect, but it is a convenience — not a
 * security control. Every read and write authorizes here, as close to the data
 * as possible. If a request reaches a route or action without passing through
 * the proxy, these functions still stop it.
 *
 * Memoised with `React.cache` so that a render pass hitting the DAL from several
 * components performs one session check and one database read, not many.
 */

export type AdminSession = {
  adminId: string
  supabaseId: string
  email: string
  name: string
}

/**
 * Resolves the Supabase session, or null.
 *
 * Uses `getUser()` rather than `getSession()`: `getSession()` returns whatever
 * is in the cookie without verifying it against the auth server, which makes it
 * unsafe as the basis for an authorization decision.
 */
export const getSupabaseUser = cache(async () => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return null

  return data.user
})

/**
 * The authenticated admin, or null. Does not redirect — use for UI that varies
 * by auth state (e.g. the preview banner).
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const user = await getSupabaseUser()
  if (!user) return null

  const admin = await prisma.adminUser.findUnique({
    where: { supabaseId: user.id },
    // Explicit selection: only what the application needs leaves the DAL.
    select: { id: true, supabaseId: true, email: true, name: true, isActive: true },
  })

  if (!admin) {
    // A valid Supabase user with no AdminUser row is not an administrator.
    // Worth logging: it means someone authenticated who should not have.
    logger.warn('Authenticated Supabase user has no AdminUser record', {
      supabaseId: user.id,
    })
    return null
  }

  if (!admin.isActive) {
    logger.warn('Deactivated admin attempted access', { adminId: admin.id })
    return null
  }

  return {
    adminId: admin.id,
    supabaseId: admin.supabaseId,
    email: admin.email,
    name: admin.name,
  }
})

/**
 * The authenticated admin, or a redirect to login.
 *
 * Call this first in every admin route, Server Action, and route handler.
 * A Server Action is a public HTTP endpoint; checks in the calling component
 * protect nothing.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return session
}
