import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 renamed `middleware` to `proxy`. Node runtime only — the `runtime`
 * config option is not available here and setting it throws.
 *
 * ⚠️  The matcher below is deliberately narrow (ADR-014). Proxy runs before the
 * CDN cache, so matching public routes would undermine the CDN-served static
 * shell that the entire performance budget depends on. Every authenticated
 * surface currently lives under /admin.
 *
 * **If authenticated content ever appears outside /admin, this matcher must be
 * revisited** — and the DAL, not this file, remains the security boundary.
 *
 * Two jobs here, both cheap:
 *   1. Refresh the Supabase session cookie and optimistically redirect.
 *   2. Issue a strict nonce-based CSP for the admin (ADR-013). The admin is
 *      dynamic by design, so a per-request nonce costs nothing here.
 */

const LOGIN_PATH = '/admin/login'

/** Paths under the matcher that must remain reachable without a session. */
const PUBLIC_ADMIN_PATHS = [
  LOGIN_PATH,
  '/admin/forgot-password',
  '/admin/reset-password',
]

function buildAdminCsp(nonce: string, isDev: boolean) {
  return [
    "default-src 'self'",
    /**
     * Nonce **and** `'self'`, without `'strict-dynamic'`.
     *
     * `'strict-dynamic'` tells the browser to ignore host allowlists entirely
     * and trust only nonced scripts plus whatever those load. Next.js nonces
     * its inline flight-data scripts but emits the chunk `<script src>` tags
     * without one — so every one of them was blocked, React never hydrated, and
     * the whole admin rendered as dead HTML in production. Forms still posted
     * (Server Actions degrade gracefully) which is precisely why it went
     * unnoticed: the login page looked fine and the section editor, the media
     * uploader and every button silently did nothing.
     *
     * Dropping `'strict-dynamic'` restores `'self'` for those chunks while the
     * nonce still governs inline scripts. This remains stricter than the public
     * site's policy, which allows `'unsafe-inline'` — and no user-supplied HTML
     * is ever rendered anywhere in this application (ADR-016).
     */
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    // Next.js injects inline styles that carry no nonce; 'unsafe-inline' is
    // required for styles specifically and is far lower risk than for scripts.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const csp = buildAdminCsp(nonce, isDev)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Without Supabase configured there is no session to read. Fail closed for
  // protected paths rather than letting everything through.
  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request: { headers: requestHeaders } })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    })

    // Refreshes the session cookie as a side effect. This is an *optimistic*
    // check only — it never queries our database, because proxy runs on every
    // matched request including prefetches.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) =>
      pathname.startsWith(path),
    )

    if (!user && pathname.startsWith('/admin') && !isPublicAdminPath) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = LOGIN_PATH
      // Preserve where they were heading so login can return them there.
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (user && pathname === LOGIN_PATH) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin'
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
  }

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // The admin must never be cached by a CDN or shared proxy.
  response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate')

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/preview/:path*'],
}
