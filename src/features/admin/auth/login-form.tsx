'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import type { ActionResult } from '@/server/actions/result'

import { login } from './actions'

function SubmitButton() {
  // useFormStatus must be read from a child of the <form>, not the form itself.
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  )
}

export function LoginForm({ next }: { next?: string | undefined }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(login, null)

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  const message = state && !state.ok ? state.message : undefined

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

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

      <Field id="password" label="Password" error={fieldErrors?.password?.[0]}>
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>

      {message && (
        // role="alert" so the failure is announced, not just displayed.
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
