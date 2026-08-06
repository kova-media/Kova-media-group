import type { Metadata } from 'next'

import { AuthCard } from '@/features/admin/auth/auth-card'
import { ResetPasswordForm } from '@/features/admin/auth/password-forms'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm />
    </AuthCard>
  )
}
