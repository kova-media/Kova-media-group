'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import type { ActionResult } from '@/server/actions/result'
import type { PartnerLogoAdminRow } from '@/server/content/library-queries'

import {
  removePartnerLogo,
  reorderPartnerLogosAction,
  savePartnerLogo,
} from './actions'

/**
 * Client logo management.
 *
 * Order matters here — the logo strip reads left to right and the first few are
 * the ones most visitors actually register — so the move controls are the
 * primary interaction, not an afterthought.
 */
export function PartnerLogoManager({ rows }: { rows: PartnerLogoAdminRow[] }) {
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

    startReordering(() => void reorderPartnerLogosAction(ordered))
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, index) => (
        <div key={row.id} className="rounded-lg border border-border bg-card">
          {editingId === row.id ? (
            <LogoForm row={row} onDone={() => setEditingId(null)} />
          ) : (
            <div className="flex items-center gap-4 p-5">
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

              <div className="flex h-10 w-28 shrink-0 items-center justify-center rounded border border-border bg-paper-sunk">
                {row.media ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.media.url}
                    alt={row.name}
                    className="max-h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs text-destructive">Missing</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{row.name}</p>
                {!row.isPublished && (
                  <span className="mt-1 inline-block rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">
                    Hidden
                  </span>
                )}
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
          <LogoForm row={null} onDone={() => setCreating(false)} />
        </div>
      ) : (
        <div>
          <Button onClick={() => setCreating(true)}>Add client logo</Button>
        </div>
      )}

      {rows.length === 0 && !isCreating && (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-ink-500">
          No client logos yet. The homepage shows brand names as text until you add
          them.
        </p>
      )}
    </div>
  )
}

function LogoForm({
  row,
  onDone,
}: {
  row: PartnerLogoAdminRow | null
  onDone: () => void
}) {
  const [state, setState] = useState<ActionResult | null>(null)
  const [isSaving, startSaving] = useTransition()

  const submit = (formData: FormData) => {
    startSaving(async () => {
      const result = await savePartnerLogo(null, formData)
      if (result.ok) onDone()
      else setState(result)
    })
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={submit} className="flex flex-col gap-4 p-5" noValidate>
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`name-${row?.id ?? 'new'}`}
          label="Brand name"
          hint="Used as the logo's alt text."
          error={errors?.name?.[0]}
        >
          {(props) => <Input {...props} name="name" defaultValue={row?.name ?? ''} />}
        </Field>

        <Field
          id={`href-${row?.id ?? 'new'}`}
          label="Link"
          hint="Optional."
          error={errors?.href?.[0]}
        >
          {(props) => <Input {...props} name="href" defaultValue={row?.href ?? ''} />}
        </Field>
      </div>

      <MediaFormField
        name="mediaId"
        label="Logo image"
        initialAsset={row?.media ?? null}
        hint="An SVG or transparent PNG works best."
      />
      {errors?.mediaId?.[0] && (
        <p className="text-xs text-destructive">{errors.mediaId[0]}</p>
      )}

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
        onClick={() => startDeleting(() => void removePartnerLogo(id))}
      >
        {isDeleting ? 'Deleting…' : 'Confirm'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  )
}
