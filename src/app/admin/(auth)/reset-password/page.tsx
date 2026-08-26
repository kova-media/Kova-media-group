import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/features/admin/auth/auth-card'
import { ResetPasswordForm } from '@/features/admin/auth/password-forms'
import { RecoveryFragment } from '@/features/admin/auth/recovery-fragment'
import { getSupabaseUser } from '@/server/auth/dal'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

/**
 * The screen a recovery link lands on.
 *
 * The session is checked here rather than only when the form is submitted. A
 * form that accepts a new password twice and then says "this link has expired"
 * wastes the one attempt someone gets before they have to go back to their
 * inbox — the state of the link is knowable on arrival, so it is shown on
 * arrival.
 */
/**
 * Blocking rather than instant-shell.
 *
 * Reading the session is the point of this page — whether there is a valid
 * recovery link decides which of two entirely different screens renders, and a
 * shell that flashes a password form before replacing it with "this link has
 * expired" is worse than waiting a few milliseconds.
 */
export const instant = false

export default async function ResetPasswordPage() {
  const user = await getSupabaseUser()

  return (
    <AuthCard
      title="Choose a new password"
      description={user?.email ? `Signed in as ${user.email}.` : undefined}
    >
      {/* Implicit-flow links carry their tokens in the fragment, which never
          reaches the server. This reads them, establishes the session, and
          re-renders — so the branch below is correct either way. */}
      <RecoveryFragment />

      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-600">
            This link has expired, has already been used, or was opened in a different
            browser from the one that requested it. Reset links are single-use and
            short-lived.
          </p>
          <Link
            href="/admin/forgot-password"
            className="text-sm font-medium text-accent-600 hover:underline"
          >
            Send a new reset link
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
