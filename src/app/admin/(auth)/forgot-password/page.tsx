import type { Metadata } from 'next'

import { AuthCard } from '@/features/admin/auth/auth-card'
import { ForgotPasswordForm } from '@/features/admin/auth/password-forms'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

/**
 * Blocking rather than instant-shell.
 *
 * The page reads `searchParams` to show why a reset link failed, which makes it
 * dynamic. Streaming a shell first would be the wrong trade here: this is an
 * auth screen behind no cache, it renders in milliseconds, and the message is
 * the whole reason someone has landed on it.
 */
export const instant = false

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<'/admin/forgot-password'>) {
  // The callback route sends people here with a reason when a link could not be
  // used, so the dead end explains itself instead of looking like a bug.
  const { error } = await searchParams
  const message = typeof error === 'string' ? error : undefined

  return (
    <AuthCard
      title="Reset password"
      description="We'll email you a link to choose a new one."
    >
      {message && (
        <p role="alert" className="mb-5 text-sm text-destructive">
          {message}
        </p>
      )}
      <ForgotPasswordForm />
    </AuthCard>
  )
}
