import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/env'

/**
 * Supabase client bound to the request's cookies.
 *
 * Identity only (ADR-004). Data access goes through Prisma; this client exists
 * to read and refresh the admin session.
 *
 * `cookies()` is async in Next.js 16. Because this reads request state it can
 * never be called inside a `'use cache'` scope — which is exactly the boundary
 * we want between the admin and the cached public site.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Components cannot set cookies. Session refresh happens in
            // proxy.ts and in Server Actions, both of which can — so swallowing
            // this is safe rather than merely convenient.
          }
        },
      },
    },
  )
}
