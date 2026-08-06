'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MediaAssetDto } from '@/server/content/types'

import { useMediaUpload } from './use-media-upload'

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/avif,image/svg+xml,application/pdf'

export function UploadDropzone({
  folder,
  onUploaded,
}: {
  folder: string | null
  onUploaded: (asset: MediaAssetDto) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setDragging] = useState(false)
  const { items, upload, clearCompleted } = useMediaUpload(onUploaded)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    void upload(Array.from(fileList), folder)
  }

  const active = items.filter((item) => item.status !== 'done')

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
        className={cn(
          'rounded-md border border-dashed px-4 py-6 text-center transition-colors',
          isDragging
            ? 'border-accent-600 bg-accent-50'
            : 'border-ink-200 bg-paper-sunk',
        )}
      >
        <p className="text-sm text-ink-600">Drag images here</p>
        <p className="mt-1 text-xs text-ink-500">
          JPG, PNG, WebP, AVIF, SVG or PDF · up to 15MB
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files)
            // Reset so re-picking the same file fires change again.
            event.target.value = ''
          }}
        />
      </div>

      {active.length > 0 && (
        <ul className="flex flex-col gap-1" aria-live="polite">
          {active.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between text-xs text-ink-600"
            >
              <span className="truncate">{item.filename}</span>
              <span
                className={cn(
                  'ml-3 shrink-0',
                  item.status === 'error' ? 'text-destructive' : 'text-ink-500',
                )}
              >
                {item.status === 'uploading' && 'Uploading…'}
                {item.status === 'processing' && 'Processing…'}
                {item.status === 'pending' && 'Waiting…'}
                {item.status === 'error' && (item.message ?? 'Failed')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {items.some((item) => item.status === 'done') && active.length === 0 && (
        <button
          type="button"
          onClick={clearCompleted}
          className="self-start text-xs text-ink-500 underline hover:text-ink-800"
        >
          Clear upload list
        </button>
      )}
    </div>
  )
}
