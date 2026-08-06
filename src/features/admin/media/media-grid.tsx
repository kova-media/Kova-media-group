'use client'

import Image from 'next/image'

import { cn } from '@/lib/utils'
import type { MediaAssetDto } from '@/server/content/types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function MediaThumbnail({ asset }: { asset: MediaAssetDto }) {
  const isImage = asset.mimeType.startsWith('image/')

  if (!isImage) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ink-100 text-xs text-ink-500">
        {asset.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE'}
      </div>
    )
  }

  return (
    <Image
      src={asset.url}
      alt=""
      fill
      sizes="(max-width: 768px) 33vw, 200px"
      className="object-cover"
      {...(asset.blurDataURL
        ? { placeholder: 'blur' as const, blurDataURL: asset.blurDataURL }
        : {})}
    />
  )
}

export function MediaGrid({
  assets,
  selectedId,
  onSelect,
  emptyMessage = 'No media yet.',
}: {
  assets: MediaAssetDto[]
  selectedId?: string | undefined
  onSelect: (asset: MediaAssetDto) => void
  emptyMessage?: string
}) {
  if (assets.length === 0) {
    return <p className="py-12 text-center text-sm text-ink-500">{emptyMessage}</p>
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <li key={asset.id}>
          <button
            type="button"
            onClick={() => onSelect(asset)}
            aria-pressed={selectedId === asset.id}
            className={cn(
              'group w-full overflow-hidden rounded-md border text-left transition-colors',
              selectedId === asset.id
                ? 'border-accent-600 ring-2 ring-accent-600/30'
                : 'border-border hover:border-ink-300',
            )}
          >
            <div className="relative aspect-4/3 w-full bg-paper-sunk">
              <MediaThumbnail asset={asset} />
              {!asset.alt && (
                // Missing alt text is an accessibility defect, so it is surfaced
                // in the library rather than discovered on the live site.
                <span className="absolute top-1 right-1 rounded bg-warning/90 px-1.5 py-0.5 text-[10px] font-medium text-ink-950">
                  No alt
                </span>
              )}
            </div>
            <div className="px-2 py-1.5">
              <p className="truncate text-xs font-medium text-ink-900">
                {asset.filename}
              </p>
              <p className="text-[11px] text-ink-500">
                {asset.width && asset.height
                  ? `${asset.width}×${asset.height} · ${formatBytes(asset.byteSize)}`
                  : formatBytes(asset.byteSize)}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
