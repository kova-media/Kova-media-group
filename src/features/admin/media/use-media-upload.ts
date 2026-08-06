'use client'

import { useCallback, useState } from 'react'

import { createClient } from '@/lib/supabase/browser'
import type { MediaAssetDto } from '@/server/content/types'

import { finalizeUpload, requestUpload } from './actions'

export type UploadItem = {
  id: string
  filename: string
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error'
  message?: string
}

/**
 * Direct-to-storage upload (ADR-011).
 *
 *   1. Server issues a signed URL
 *   2. Browser PUTs the file straight to Supabase Storage
 *   3. Server reads the object back and derives real metadata
 *
 * Files upload one at a time rather than in parallel: this is a single-admin
 * tool, and saturating the connection makes every individual upload slower with
 * no benefit.
 */
export function useMediaUpload(onUploaded: (asset: MediaAssetDto) => void) {
  const [items, setItems] = useState<UploadItem[]>([])

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item)),
    )
  }, [])

  const upload = useCallback(
    async (files: File[], folder: string | null) => {
      const queued: UploadItem[] = files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        filename: file.name,
        status: 'pending',
      }))

      setItems((current) => [...current, ...queued])

      for (const [index, file] of files.entries()) {
        const item = queued[index]
        if (!item) continue

        patch(item.id, { status: 'uploading' })

        const ticket = await requestUpload({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          byteSize: file.size,
        })

        if (!ticket.ok) {
          patch(item.id, { status: 'error', message: ticket.message })
          continue
        }

        const supabase = createClient()
        const { error } = await supabase.storage
          .from('media')
          .uploadToSignedUrl(ticket.data.storagePath, ticket.data.token, file)

        if (error) {
          patch(item.id, { status: 'error', message: 'Upload failed. Try again.' })
          continue
        }

        patch(item.id, { status: 'processing' })

        const finalized = await finalizeUpload({
          storagePath: ticket.data.storagePath,
          filename: file.name,
          folder,
        })

        if (!finalized.ok) {
          patch(item.id, { status: 'error', message: finalized.message })
          continue
        }

        patch(item.id, { status: 'done' })
        onUploaded(finalized.data)
      }
    },
    [onUploaded, patch],
  )

  const clearCompleted = useCallback(() => {
    setItems((current) => current.filter((item) => item.status !== 'done'))
  }, [])

  return { items, upload, clearCompleted }
}
