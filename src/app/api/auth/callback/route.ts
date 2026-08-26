import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/server/auth/supabase'

/**
 * Where Supabase sends people back to after they click an emailed link.
 *
 * This route did not exist, which is why the password reset never worked: the
 * email link verified fine at Supabase, Supabase redirected back with a
 * single-use code in the query string, and nothing in the application ever
 * exchanged that code for a session. The reset form then found no session and
 * reported the link as expired.
 *
 * Two shapes arrive here and both are handled, because which one Supabase sends
 * depends on the project's flow setting and we should not be fragile about it:
 *
 *   `?code=…`                   PKCE. Exchanged against the code verifier
 *                               cookie set when the reset was requested.
 *   `?token_hash=…&type=…`      The older verification link.
 *
 * A third shape — tokens in the URL *fragment* under the implicit flow — cannot
 * reach a server at all. `RecoveryFragment` on the reset page picks that up.
 *
 * Deliberately outside the `/admin` proxy matcher: this must be reachable
 * without a session, since establishing one is the entire point.
 */
const DEFAULT_NEXT = '/admin'

/**
 * Only same-origin admin paths. `next` arrives from a URL that has travelled
 * through an email client, so it is treated as hostile: without this, the
 * password-reset link is an open redirect with a session attached.
 */
function safeNext(next: string | null): string {
  if (!next) return DEFAULT_NEXT
  if (!next.startsWith('/') || next.startsWith('//')) return DEFAULT_NEXT
  if (!next.startsWith('/admin')) return DEFAULT_NEXT
  return next
}

/** Sends the visitor back to the request screen with something readable. */
function failed(reason: string): never {
  redirect(`/admin/forgot-password?error=${encodeURIComponent(reason)}`)
}

const EXPIRED =
  'That link has expired or has already been used. Request a new one below.'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Supabase reports its own failures here rather than throwing them away.
  const error = searchParams.get('error_description') ?? searchParams.get('error')
  if (error) {
    logger.warn('Auth callback received an error from Supabase')
    failed(EXPIRED)
  }

  const next = safeNext(searchParams.get('next'))
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createServerSupabaseClient()

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      logger.warn('Auth callback could not exchange the code for a session')
      failed(EXPIRED)
    }

    redirect(next)
  }

  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: type as 'recovery' | 'email' | 'invite' | 'magiclink',
      token_hash: tokenHash,
    })

    if (verifyError) {
      logger.warn('Auth callback could not verify the token hash')
      failed(EXPIRED)
    }

    redirect(next)
  }

  // Nothing usable in the query string. Under the implicit flow the tokens are
  // in the fragment, which the browser keeps to itself — so hand the request to
  // the page that can read it rather than declaring failure here.
  redirect(next)
}
