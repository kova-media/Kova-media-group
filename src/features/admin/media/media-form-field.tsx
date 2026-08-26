'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/field'
import type { MediaAssetDto } from '@/server/content/types'

import { AltTextEditor } from './alt-text-editor'
import { MediaPickerDialog } from './media-picker-dialog'

/**
 * An image picker that posts with a plain `<form>`.
 *
 * Distinct from `MediaField`, which is the controlled version used inside the
 * section editor's own state. This one owns its value and writes it to a hidden
 * input, so any admin screen built as a normal form post can pick an image
 * without adopting the editor's state model.
 *
 * Stores an id, never a URL (ADR-012): an alt-text or metadata fix then
 * propagates everywhere the asset is used without a republish.
 */
export function MediaFormField({
  name,
  label,
  initialAsset,
  hint,
}: {
  name: string
  label: string
  initialAsset: MediaAssetDto | null
  hint?: string
}) {
  const [asset, setAsset] = useState<MediaAssetDto | null>(initialAsset)
  const [isPickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={asset?.id ?? ''} />

      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-paper-sunk">
          {asset ? (
            <Image
              src={asset.url}
              alt={asset.alt}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-ink-400">
              None
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
              {asset ? 'Replace' : 'Choose image'}
            </Button>
            {asset && (
              <Button variant="ghost" size="sm" onClick={() => setAsset(null)}>
                Remove
              </Button>
            )}
          </div>
          {hint && <p className="text-xs text-ink-500">{hint}</p>}
          {asset && (
            <p className="max-w-48 truncate text-xs text-ink-500">{asset.filename}</p>
          )}
        </div>
      </div>

      {asset && (
        <AltTextEditor
          key={asset.id}
          asset={asset}
          onSaved={(alt) => setAsset({ ...asset, alt })}
        />
      )}

      {isPickerOpen && (
        <MediaPickerDialog
          onSelect={(selected) => {
            setAsset(selected)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
