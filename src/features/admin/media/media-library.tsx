'use client'

import { useEffect, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import type { MediaAssetDto } from '@/server/content/types'
import type { MediaListResult, MediaUsage } from '@/server/media/queries'

import { archiveMedia, fetchMedia, fetchMediaUsage, updateMedia } from './actions'
import { MediaGrid } from './media-grid'
import { UploadDropzone } from './upload-dropzone'

/**
 * The media library screen: upload, browse, edit metadata, archive.
 *
 * Alt text is editable here and propagates to every page using the asset with
 * no republish, because sections reference media by id (ADR-012).
 */
export function MediaLibrary({ initial }: { initial: MediaListResult }) {
  const [assets, setAssets] = useState(initial.items)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaAssetDto | null>(null)
  const [usage, setUsage] = useState<MediaUsage[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      const result = await fetchMedia({ search: search || undefined, take: 60 })
      if (!cancelled) setAssets(result.items)
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  useEffect(() => {
    let cancelled = false

    if (!selected) {
      // Deferred so the state update does not run synchronously in the effect.
      queueMicrotask(() => {
        if (!cancelled) setUsage(null)
      })
      return () => {
        cancelled = true
      }
    }

    void fetchMediaUsage(selected.id).then((result) => {
      if (!cancelled) setUsage(result)
    })

    return () => {
      cancelled = true
    }
  }, [selected])

  const handleSave = (alt: string, caption: string, folder: string) => {
    if (!selected) return

    startTransition(async () => {
      const result = await updateMedia({
        id: selected.id,
        alt,
        caption: caption || null,
        folder: folder || null,
      })

      if (!result.ok) {
        setMessage(result.message)
        return
      }

      const next = {
        ...selected,
        alt,
        caption: caption || null,
        folder: folder || null,
      }
      setSelected(next)
      setAssets((current) =>
        current.map((asset) => (asset.id === next.id ? next : asset)),
      )
      setMessage('Saved. Live pages using this image are updated.')
    })
  }

  const handleArchive = () => {
    if (!selected) return

    startTransition(async () => {
      const result = await archiveMedia({ id: selected.id })

      if (!result.ok) {
        setMessage(result.message)
        return
      }

      setAssets((current) => current.filter((asset) => asset.id !== selected.id))
      setSelected(null)
      setMessage('Image archived.')
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <UploadDropzone
          folder={null}
          onUploaded={(asset) => setAssets((current) => [asset, ...current])}
        />

        <Input
          type="search"
          placeholder="Search by filename, alt text or caption"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <MediaGrid assets={assets} selectedId={selected?.id} onSelect={setSelected} />
      </div>

      <aside className="h-fit rounded-lg border border-border bg-card p-4">
        {selected ? (
          <MediaDetails
            key={selected.id}
            asset={selected}
            usage={usage}
            isPending={isPending}
            message={message}
            onSave={handleSave}
            onArchive={handleArchive}
          />
        ) : (
          <p className="text-sm text-ink-500">Select an image to edit its details.</p>
        )}
      </aside>
    </div>
  )
}

function MediaDetails({
  asset,
  usage,
  isPending,
  message,
  onSave,
  onArchive,
}: {
  asset: MediaAssetDto
  usage: MediaUsage[] | null
  isPending: boolean
  message: string | null
  onSave: (alt: string, caption: string, folder: string) => void
  onArchive: () => void
}) {
  const [alt, setAlt] = useState(asset.alt)
  const [caption, setCaption] = useState(asset.caption ?? '')
  const [folder, setFolder] = useState(asset.folder ?? '')

  const liveUsage = usage?.filter((entry) => entry.isLive) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="truncate text-sm font-medium text-ink-900">{asset.filename}</p>
        <p className="text-xs text-ink-500">
          {asset.width && asset.height
            ? `${asset.width}×${asset.height} · ${asset.mimeType}`
            : asset.mimeType}
        </p>
      </div>

      <Field
        id="alt"
        label="Alt text"
        hint="Describe the image. Leave empty only if it is purely decorative."
      >
        {(props) => (
          <Textarea
            {...props}
            rows={3}
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
          />
        )}
      </Field>

      <Field id="caption" label="Caption">
        {(props) => (
          <Input
            {...props}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        )}
      </Field>

      <Field id="folder" label="Folder">
        {(props) => (
          <Input
            {...props}
            value={folder}
            placeholder="e.g. client-logos"
            onChange={(event) => setFolder(event.target.value)}
          />
        )}
      </Field>

      {usage && usage.length > 0 && (
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-medium text-ink-700">
            Used on {usage.length} item{usage.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-1 flex flex-col gap-0.5 text-xs text-ink-500">
            {usage.slice(0, 6).map((entry) => (
              <li key={`${entry.entityType}-${entry.id}`} className="truncate">
                {entry.title}
                {entry.isLive && <span className="ml-1 text-success">· live</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <p role="status" className="text-xs text-ink-600">
          {message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => onSave(alt, caption, folder)}
        >
          {isPending ? 'Saving…' : 'Save details'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending || liveUsage.length > 0}
          onClick={onArchive}
        >
          {liveUsage.length > 0 ? 'Used on a live page' : 'Archive image'}
        </Button>
      </div>
    </div>
  )
}
