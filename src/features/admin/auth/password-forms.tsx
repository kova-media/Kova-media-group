'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import type { ActionResult } from '@/server/actions/result'

import { requestPasswordReset, resetPassword } from './actions'

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string
  pendingLabel: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    requestPasswordReset,
    null,
  )

  if (state?.ok) {
    return (
      <p role="status" className="text-sm text-ink-600">
        If that address belongs to an administrator, a reset link is on its way.
      </p>
    )
  }

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  const message = state && !state.ok ? state.message : undefined

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field id="email" label="Email" error={fieldErrors?.email?.[0]}>
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            required
          />
        )}
      </Field>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <SubmitButton label="Send reset link" pendingLabel="Sending…" />
    </form>
  )
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    resetPassword,
    null,
  )

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  const message = state && !state.ok ? state.message : undefined

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field
        id="password"
        label="New password"
        hint="At least 12 characters."
        error={fieldErrors?.password?.[0]}
      >
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <Field
        id="confirmPassword"
        label="Confirm password"
        error={fieldErrors?.confirmPassword?.[0]}
      >
        {(props) => (
          <Input
            {...props}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <SubmitButton label="Update password" pendingLabel="Updating…" />
    </form>
  )
}
