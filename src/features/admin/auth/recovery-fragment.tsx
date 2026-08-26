'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/browser'

const EXPIRED =
  'That link has expired or has already been used. Request a new one below.'

/**
 * Picks up a recovery link whose tokens arrive in the URL fragment.
 *
 * Supabase sends recovery tokens one of two ways depending on the project's
 * flow setting. Under PKCE they come back as a query parameter and
 * `/api/auth/callback` exchanges them server-side. Under the implicit flow they
 * come back after a `#`, and a fragment is never transmitted to a server — so
 * without this component that link produces a form with no session behind it,
 * which is precisely the bug being fixed.
 *
 * Renders nothing. It establishes the session and re-renders the page, or sends
 * the visitor to the request screen with a reason — the same destination and
 * the same wording the server-side callback uses, so a failed link reads the
 * same however it failed.
 */
export function RecoveryFragment() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return

    const params = new URLSearchParams(hash)

    if (params.get('error_description') ?? params.get('error')) {
      router.replace(`/admin/forgot-password?error=${encodeURIComponent(EXPIRED)}`)
      return
    }

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) return

    let cancelled = false

    void (async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (cancelled) return

      // Cleared first, so the tokens do not survive in the address bar, in
      // history, or in a referrer header.
      window.history.replaceState(null, '', window.location.pathname)

      if (error) {
        router.replace(`/admin/forgot-password?error=${encodeURIComponent(EXPIRED)}`)
        return
      }

      // The page chooses between the form and the expired notice from the
      // session, and that choice was made on the server before this ran.
      router.refresh()
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  return null
}
