'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/field'
import type { MediaAssetDto } from '@/server/content/types'

import { AltTextEditor } from './alt-text-editor'
import { MediaPickerDialog } from './media-picker-dialog'

export type MediaRef = { mediaId: string; altOverride?: string }

/**
 * Media selection for a section field.
 *
 * Stores an id, never a URL (ADR-012), so an alt-text or metadata fix
 * propagates to every page using the asset without a republish.
 */
export function MediaField({
  label,
  value,
  media,
  onChange,
  registerAsset,
}: {
  label: string
  value: MediaRef | undefined
  media: Map<string, MediaAssetDto>
  onChange: (value: MediaRef | undefined) => void
  registerAsset: (asset: MediaAssetDto) => void
}) {
  const [isPickerOpen, setPickerOpen] = useState(false)
  const asset = value ? media.get(value.mediaId) : undefined

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>

      {value && !asset && (
        <p className="text-xs text-destructive" role="alert">
          The selected image is missing. Publishing will be blocked until it is
          replaced.
        </p>
      )}

      {asset ? (
        <div className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-paper-sunk">
            <Image
              src={asset.url}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              {...(asset.blurDataURL
                ? { placeholder: 'blur' as const, blurDataURL: asset.blurDataURL }
                : {})}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">
              {asset.filename}
            </p>
            <p className="text-xs text-ink-500">
              {asset.width && asset.height
                ? `${asset.width}×${asset.height}`
                : 'Dimensions unknown'}
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                Replace
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
          Choose image
        </Button>
      )}

      {asset && (
        <AltTextEditor
          key={asset.id}
          asset={asset}
          onSaved={(alt) => registerAsset({ ...asset, alt })}
        />
      )}

      {isPickerOpen && (
        <MediaPickerDialog
          onClose={() => setPickerOpen(false)}
          onSelect={(selected) => {
            registerAsset(selected)
            onChange({ mediaId: selected.id })
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )
}
