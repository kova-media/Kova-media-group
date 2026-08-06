'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import type { PageForEdit } from '@/server/content/admin-queries'
import type { SectionType } from '@/server/content/sections/types'
import type { MediaAssetDto } from '@/server/content/types'

import { addSection, publishPage, unpublishPage } from '../actions'
import { AddSectionMenu } from './add-section-menu'
import { SaveIndicator } from './save-indicator'
import { SectionForm } from './section-form'
import { SectionList, type SectionMeta } from './section-list'
import { usePageDraft } from './use-page-draft'

/**
 * The page editor.
 *
 * Two panes: an ordered section list on the left, the selected section's form
 * on the right. The editor controls composition and content — never layout,
 * spacing or type (ADR-007).
 */
export function SectionEditor({
  page,
  catalogue,
  initialMedia,
}: {
  page: PageForEdit
  catalogue: SectionMeta[]
  initialMedia: MediaAssetDto[]
}) {
  const draft = usePageDraft(page.id, page.draft.content, page.draftVersion)
  const [selectedId, setSelectedId] = useState<string | null>(
    page.draft.content.sections[0]?.id ?? null,
  )
  const [media, setMedia] = useState(
    () => new Map(initialMedia.map((asset) => [asset.id, asset])),
  )
  const [publishState, setPublishState] = useState<
    { status: 'idle' } | { status: 'error'; message: string } | { status: 'done' }
  >({ status: 'idle' })
  const [isPending, startTransition] = useTransition()

  const sections = draft.content.sections
  const selected = useMemo(
    () => sections.find((section) => section.id === selectedId) ?? null,
    [sections, selectedId],
  )

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      draft.update((current) => {
        const index = current.sections.findIndex((section) => section.id === id)
        const target = index + direction
        if (index < 0 || target < 0 || target >= current.sections.length) return current

        const next = [...current.sections]
        const [moved] = next.splice(index, 1)
        if (moved) next.splice(target, 0, moved)
        return { sections: next }
      })
    },
    [draft],
  )

  const toggle = useCallback(
    (id: string) => {
      draft.update((current) => ({
        sections: current.sections.map((section) =>
          section.id === id ? { ...section, isEnabled: !section.isEnabled } : section,
        ),
      }))
    },
    [draft],
  )

  const remove = useCallback(
    (id: string) => {
      draft.update((current) => ({
        sections: current.sections.filter((section) => section.id !== id),
      }))
      setSelectedId((current) => (current === id ? null : current))
    },
    [draft],
  )

  /** Folds a freshly picked asset into the map so it renders without a refetch. */
  const registerAsset = useCallback((asset: MediaAssetDto) => {
    setMedia((current) => new Map(current).set(asset.id, asset))
  }, [])

  const updateSelectedData = useCallback(
    (data: Record<string, unknown>) => {
      if (!selected) return
      draft.update((current) => ({
        sections: current.sections.map((section) =>
          section.id === selected.id ? { ...section, data } : section,
        ),
      }))
    },
    [draft, selected],
  )

  const handleAdd = (type: SectionType) => {
    startTransition(async () => {
      // Added server-side so defaults come from the registry and the version
      // bump stays authoritative.
      await draft.saveNow()
      const result = await addSection({
        pageId: page.id,
        expectedVersion: draft.getVersion(),
        type,
      })

      if (!result.ok) {
        setPublishState({ status: 'error', message: result.message })
        return
      }

      // Reload to pick up the server-created section with its generated id.
      window.location.reload()
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      await draft.saveNow()

      if (draft.isBlocked()) {
        setPublishState({
          status: 'error',
          message: 'Reload before publishing — this page changed elsewhere.',
        })
        return
      }

      const result = await publishPage({ pageId: page.id })
      setPublishState(
        result.ok ? { status: 'done' } : { status: 'error', message: result.message },
      )
    })
  }

  const handleUnpublish = () => {
    startTransition(async () => {
      const result = await unpublishPage({ pageId: page.id })
      setPublishState(
        result.ok ? { status: 'done' } : { status: 'error', message: result.message },
      )
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <SaveIndicator state={draft.saveState} />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              window.open(
                `/api/preview?slug=${encodeURIComponent(page.slug)}`,
                '_blank',
              )
            }
          >
            Preview
          </Button>
          {page.isLive && (
            <Button
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={handleUnpublish}
            >
              Unpublish
            </Button>
          )}
          <Button size="sm" disabled={isPending} onClick={handlePublish}>
            {isPending ? 'Working…' : page.isLive ? 'Publish changes' : 'Publish'}
          </Button>
        </div>
      </div>

      {publishState.status === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {publishState.message}
        </p>
      )}

      {publishState.status === 'done' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-ink-800"
        >
          Published. The live site is updated.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-3">
          <AddSectionMenu
            catalogue={catalogue}
            disabled={isPending}
            onAdd={handleAdd}
          />
          <SectionList
            sections={sections}
            catalogue={catalogue}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={move}
            onToggle={toggle}
            onRemove={remove}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          {selected ? (
            <>
              <h2 className="mb-4 text-sm font-medium text-ink-950">
                {catalogue.find((entry) => entry.type === selected.type)?.label ??
                  selected.type}
              </h2>
              <SectionForm
                type={selected.type as SectionType}
                data={(selected.data ?? {}) as Record<string, unknown>}
                onChange={updateSelectedData}
                media={media}
                registerAsset={registerAsset}
              />
            </>
          ) : (
            <p className="py-12 text-center text-sm text-ink-500">
              Select a section to edit it.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
