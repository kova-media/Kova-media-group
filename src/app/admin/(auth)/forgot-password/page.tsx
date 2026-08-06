import type { Metadata } from 'next'

import { AuthCard } from '@/features/admin/auth/auth-card'
import { ForgotPasswordForm } from '@/features/admin/auth/password-forms'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="We'll email you a link to choose a new one."
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
