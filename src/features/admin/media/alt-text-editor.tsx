'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/field'
import type { MediaAssetDto } from '@/server/content/types'

import { updateMedia } from './actions'

/**
 * Alt text, edited where the image is chosen.
 *
 * Alt lives on the asset, not on the usage (ADR-012), so a fix here reaches
 * every page showing that image with no republish — which is the behaviour an
 * editor expects and the reason the CMS stores ids rather than URLs. The
 * trade-off is discoverability: nobody picking a hero image thinks to go to
 * Media afterwards, and a missing alt is an accessibility defect nobody sees.
 * So the field comes to them, and says plainly that it applies everywhere.
 *
 * Saved on its own rather than with the surrounding form, because it writes to
 * a different row and the surrounding form may never be submitted.
 */
export function AltTextEditor({
  asset,
  onSaved,
}: {
  asset: MediaAssetDto
  onSaved?: (alt: string) => void
}) {
  const [alt, setAlt] = useState(asset.alt)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  const dirty = alt !== (saved ?? asset.alt)

  const save = () => {
    startSaving(async () => {
      const result = await updateMedia({
        id: asset.id,
        alt,
        caption: asset.caption,
        folder: asset.folder,
      })

      if (result.ok) {
        setSaved(alt)
        setError(null)
        onSaved?.(alt)
      } else {
        setError(result.message)
      }
    })
  }

  const id = `alt-${asset.id}`

  return (
    <div className="mt-2 flex flex-col gap-1.5 rounded-md border border-border bg-paper-sunk p-3">
      <Label htmlFor={id}>Alt text</Label>
      <p className="text-xs text-ink-500">
        Describes the image for screen readers and when it fails to load. Applies
        everywhere this image is used.
      </p>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={alt}
          maxLength={300}
          placeholder="Zilkee's welcome email, shown on a phone"
          onChange={(event) => setAlt(event.target.value)}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={isSaving || !dirty}
          onClick={save}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {!alt.trim() && (
        <p className="text-xs text-ink-600">
          No alt text yet. Leave it empty only if the image is purely decorative.
        </p>
      )}
      {saved !== null && !dirty && <p className="text-xs text-success">Alt saved.</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
