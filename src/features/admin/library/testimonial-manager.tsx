'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import type { ActionResult } from '@/server/actions/result'
import type { TestimonialAdminRow } from '@/server/content/library-queries'

import {
  removeTestimonial,
  reorderTestimonialsAction,
  saveTestimonial,
} from './actions'

/**
 * Testimonial management.
 *
 * Rows are edited in place rather than on a separate screen: a testimonial is
 * three short fields, and a round trip to a detail page for each one would make
 * a five-minute job feel like an afternoon.
 *
 * Reordering is by explicit move buttons rather than drag-and-drop. The list is
 * short, the buttons work on touch and with a keyboard, and drag-and-drop here
 * would be a dependency and an accessibility problem for no real gain.
 */
export function TestimonialManager({ rows }: { rows: TestimonialAdminRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setCreating] = useState(false)
  const [isReordering, startReordering] = useTransition()

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return

    const ordered = rows.map((row) => row.id)
    const [moved] = ordered.splice(index, 1)
    if (!moved) return
    ordered.splice(target, 0, moved)

    startReordering(() => void reorderTestimonialsAction(ordered))
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, index) => (
        <div key={row.id} className="rounded-lg border border-border bg-card">
          {editingId === row.id ? (
            <TestimonialForm row={row} onDone={() => setEditingId(null)} />
          ) : (
            <div className="flex items-start gap-4 p-5">
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Move up"
                  disabled={index === 0 || isReordering}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Move down"
                  disabled={index === rows.length - 1 || isReordering}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </Button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-800">“{row.quote}”</p>
                <p className="mt-2 text-xs text-ink-500">
                  {row.authorName}
                  {row.authorRole && `, ${row.authorRole}`} · {row.companyName}
                  {!row.isPublished && (
                    <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-ink-600">
                      Hidden
                    </span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingId(row.id)}
                >
                  Edit
                </Button>
                <DeleteButton id={row.id} />
              </div>
            </div>
          )}
        </div>
      ))}

      {isCreating ? (
        <div className="rounded-lg border border-border bg-card">
          <TestimonialForm row={null} onDone={() => setCreating(false)} />
        </div>
      ) : (
        <div>
          <Button onClick={() => setCreating(true)}>Add testimonial</Button>
        </div>
      )}

      {rows.length === 0 && !isCreating && (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-ink-500">
          No testimonials yet. The site falls back to the bundled quotes until you
          add one.
        </p>
      )}
    </div>
  )
}

function TestimonialForm({
  row,
  onDone,
}: {
  row: TestimonialAdminRow | null
  onDone: () => void
}) {
  const [state, setState] = useState<ActionResult | null>(null)
  const [isSaving, startSaving] = useTransition()

  /**
   * The action is called inside a transition rather than through
   * `useActionState` so that closing the editor on success is a direct
   * consequence of the result. Reacting to a state change instead would mean
   * either setting state during render or an effect that fires on every
   * result — both worse than just handling it here.
   */
  const submit = (formData: FormData) => {
    startSaving(async () => {
      const result = await saveTestimonial(null, formData)
      if (result.ok) onDone()
      else setState(result)
    })
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={submit} className="flex flex-col gap-4 p-5" noValidate>
      {row && <input type="hidden" name="id" value={row.id} />}

      <Field id={`quote-${row?.id ?? 'new'}`} label="Quote" error={errors?.quote?.[0]}>
        {(props) => (
          <Textarea {...props} name="quote" rows={3} defaultValue={row?.quote ?? ''} />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id={`authorName-${row?.id ?? 'new'}`}
          label="Attribution"
          hint="A name, or a role such as “Founder”."
          error={errors?.authorName?.[0]}
        >
          {(props) => (
            <Input {...props} name="authorName" defaultValue={row?.authorName ?? ''} />
          )}
        </Field>

        <Field
          id={`authorRole-${row?.id ?? 'new'}`}
          label="Role"
          error={errors?.authorRole?.[0]}
        >
          {(props) => (
            <Input {...props} name="authorRole" defaultValue={row?.authorRole ?? ''} />
          )}
        </Field>

        <Field
          id={`companyName-${row?.id ?? 'new'}`}
          label="Company"
          error={errors?.companyName?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              name="companyName"
              defaultValue={row?.companyName ?? ''}
            />
          )}
        </Field>
      </div>

      <MediaFormField
        name="avatarId"
        label="Avatar"
        initialAsset={row?.avatar ?? null}
        hint="Optional."
      />
      <input type="hidden" name="companyLogoId" value={row?.companyLogoId ?? ''} />

      <label className="flex items-center gap-2.5 text-sm text-ink-800">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={row?.isPublished ?? true}
          className="size-4 rounded border-input accent-accent-600"
        />
        Show on the site
      </label>

      {state && !state.ok && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isDeleting, startDeleting] = useTransition()

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="destructive"
        size="sm"
        disabled={isDeleting}
        onClick={() => startDeleting(() => void removeTestimonial(id))}
      >
        {isDeleting ? 'Deleting…' : 'Confirm'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  )
}
