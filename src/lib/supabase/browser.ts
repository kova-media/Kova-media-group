import 'client-only'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for the browser. Used **only** for the admin auth session —
 * never for data. Every application table denies the anon and authenticated
 * roles (ADR-006), so this client cannot read content even if asked to.
 *
 * Reads `process.env` directly rather than `@/env`, which is server-only.
 * Next.js inlines `NEXT_PUBLIC_*` at build time.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase browser client is missing NEXT_PUBLIC_SUPABASE_* config.')
  }

  return createBrowserClient(url, anonKey)
}
