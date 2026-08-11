'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import type { ActionResult } from '@/server/actions/result'

import { createCaseStudyAction } from './actions'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Creating…' : 'Create case study'}
    </Button>
  )
}

export function NewCaseStudyForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    createCaseStudyAction,
    null,
  )
  const [clientName, setClientName] = useState('')
  const [slug, setSlug] = useState('')
  // The slug tracks the client name until the editor takes it over by hand;
  // after that it is theirs, and retyping the name must not overwrite it.
  const [slugEdited, setSlugEdited] = useState(false)

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  const message = state && !state.ok ? state.message : undefined

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5" noValidate>
      <Field id="clientName" label="Client name" error={fieldErrors?.clientName?.[0]}>
        {(props) => (
          <Input
            {...props}
            name="clientName"
            value={clientName}
            autoFocus
            required
            onChange={(event) => {
              setClientName(event.target.value)
              if (!slugEdited) setSlug(slugify(event.target.value))
            }}
          />
        )}
      </Field>

      <Field
        id="headline"
        label="Headline"
        hint="One line summarising the outcome."
        error={fieldErrors?.headline?.[0]}
      >
        {(props) => <Input {...props} name="headline" required />}
      </Field>

      <Field
        id="slug"
        label="URL slug"
        hint={`/case-studies/${slug || '…'}`}
        error={fieldErrors?.slug?.[0]}
      >
        {(props) => (
          <Input
            {...props}
            name="slug"
            value={slug}
            required
            onChange={(event) => {
              setSlugEdited(true)
              setSlug(event.target.value)
            }}
          />
        )}
      </Field>

      {message && <p className="text-sm text-destructive">{message}</p>}

      <div>
        <SubmitButton />
      </div>
    </form>
  )
}
