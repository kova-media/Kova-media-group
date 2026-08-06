'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import type { ActionResult } from '@/server/actions/result'

import { createNewPage } from './actions'

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
      {pending ? 'Creating…' : 'Create page'}
    </Button>
  )
}

export function NewPageForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    createNewPage,
    null,
  )
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  const message = state && !state.ok ? state.message : undefined

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
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
              // Mirror the title until the editor takes control of the slug.
              if (!slugEdited) setSlug(slugify(event.target.value))
            }}
          />
        )}
      </Field>

      <Field
        id="slug"
        label="URL slug"
        hint={`The page will live at /${slug || 'your-slug'}`}
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

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
