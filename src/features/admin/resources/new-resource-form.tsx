'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import type { ActionResult } from '@/server/actions/result'

import { createResourceAction } from './actions'

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
      {pending ? 'Creating…' : 'Create article'}
    </Button>
  )
}

export function NewResourceForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    createResourceAction,
    null,
  )
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  // The slug tracks the title until the editor takes it over by hand.
  const [slugEdited, setSlugEdited] = useState(false)

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  const message = state && !state.ok ? state.message : undefined

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5" noValidate>
      <Field id="title" label="Title" error={fieldErrors?.title?.[0]}>
        {(props) => (
          <Input
            {...props}
            name="title"
            value={title}
            autoFocus
            required
            onChange={(event) => {
              setTitle(event.target.value)
              if (!slugEdited) setSlug(slugify(event.target.value))
            }}
          />
        )}
      </Field>

      <Field
        id="category"
        label="Category"
        hint="Used as the filter label on the resources page."
        error={fieldErrors?.category?.[0]}
      >
        {(props) => <Input {...props} name="category" required />}
      </Field>

      <Field
        id="slug"
        label="URL slug"
        hint={`/resources/${slug || '…'}`}
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
