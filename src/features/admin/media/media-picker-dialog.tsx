'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import type { MediaAssetDto } from '@/server/content/types'

import { fetchMedia } from './actions'
import { MediaGrid } from './media-grid'
import { UploadDropzone } from './upload-dropzone'

/**
 * Modal picker for choosing or uploading an image.
 *
 * Uses a native `<dialog>` so focus trapping, Escape and the top layer come
 * from the platform rather than from us reimplementing them badly.
 */
export function MediaPickerDialog({
  onSelect,
  onClose,
}: {
  onSelect: (asset: MediaAssetDto) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [assets, setAssets] = useState<MediaAssetDto[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MediaAssetDto | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    let cancelled = false

    // The loading flag is set inside the timer rather than in the effect body:
    // a synchronous setState during an effect triggers a cascading render.
    const timer = setTimeout(async () => {
      if (cancelled) return
      setLoading(true)

      const result = await fetchMedia({ search: search || undefined, take: 60 })
      if (!cancelled) {
        setAssets(result.items)
        setLoading(false)
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  const handleUploaded = (asset: MediaAssetDto) => {
    setAssets((current) => [asset, ...current])
    setSelected(asset)
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-label="Choose media"
      className="m-auto w-[min(56rem,92vw)] rounded-lg bg-card p-0 text-ink-900 shadow-lifted backdrop:bg-ink-950/40"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium text-ink-950">Media library</h2>
        <Button variant="ghost" size="sm" onClick={() => dialogRef.current?.close()}>
          Close
        </Button>
      </div>

      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-5">
        <UploadDropzone folder={null} onUploaded={handleUploaded} />

        <Input
          type="search"
          placeholder="Search by filename, alt text or caption"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {isLoading ? (
          <p className="py-12 text-center text-sm text-ink-500">Loading…</p>
        ) : (
          <MediaGrid
            assets={assets}
            selectedId={selected?.id}
            onSelect={setSelected}
            emptyMessage={search ? 'Nothing matches that search.' : 'No media yet.'}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <p className="text-xs text-ink-500">
          {selected ? selected.filename : 'Select an image'}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
          >
            Use image
          </Button>
        </div>
      </div>
    </dialog>
  )
}
