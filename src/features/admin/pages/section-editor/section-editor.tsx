'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
 * Two panes: an ordered section list on the left, and every section on the
 * right as a collapsible card. The list is the map — clicking a section there
 * opens its card and jumps to it — so a long page can be scanned without
 * scrolling through every form. The editor controls composition and content —
 * never layout, spacing or type (ADR-007).
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(page.draft.content.sections.slice(0, 1).map((section) => section.id)),
  )
  const [scrollToId, setScrollToId] = useState<string | null>(null)
  const [media, setMedia] = useState(
    () => new Map(initialMedia.map((asset) => [asset.id, asset])),
  )
  const [publishState, setPublishState] = useState<
    { status: 'idle' } | { status: 'error'; message: string } | { status: 'done' }
  >({ status: 'idle' })
  const [isPending, startTransition] = useTransition()

  const sections = draft.content.sections

  // Scrolls once the target card has rendered — it may just have been
  // expanded, or just added by the server — then clears itself.
  useEffect(() => {
    if (!scrollToId) return
    document
      .getElementById(`section-${scrollToId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setScrollToId(null)
  }, [scrollToId, expandedIds, sections])

  const scrollToSection = useCallback((id: string) => {
    setExpandedIds((current) => new Set(current).add(id))
    setScrollToId(id)
  }, [])

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id)
      scrollToSection(id)
    },
    [scrollToSection],
  )

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(sections.map((section) => section.id)))
  }, [sections])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

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
      setExpandedIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    },
    [draft],
  )

  /** Folds a freshly picked asset into the map so it renders without a refetch. */
  const registerAsset = useCallback((asset: MediaAssetDto) => {
    setMedia((current) => new Map(current).set(asset.id, asset))
  }, [])

  const updateSectionData = useCallback(
    (id: string, data: Record<string, unknown>) => {
      draft.update((current) => ({
        sections: current.sections.map((section) =>
          section.id === id ? { ...section, data } : section,
        ),
      }))
    },
    [draft],
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

      // Apply the server-created section (with its generated id) to the
      // draft in place — no reload. applyServerUpdate also moves the version
      // forward, so the autosave that follows does not conflict.
      draft.applyServerUpdate(result.data.content, result.data.version)
      setSelectedId(result.data.sectionId)
      scrollToSection(result.data.sectionId)
      setPublishState({ status: 'idle' })
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
        <div>
          <SaveIndicator state={draft.saveState} isLive={page.isLive} />
          <p className="text-xs text-ink-500">
            Changes save automatically as a draft. Only publishing makes them live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            title="Preview the saved draft in a new tab"
            onClick={() =>
              window.open(
                `/api/preview?slug=${encodeURIComponent(page.slug)}`,
                '_blank',
              )
            }
          >
            Preview
          </Button>
          {/* Never offered for a system page: it owns a real route, and taking
              it offline would turn a main URL into a 404. */}
          {page.isLive && !page.isSystem && (
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
            {isPending
              ? 'Publishing…'
              : page.isLive
                ? 'Publish changes — make live'
                : 'Publish — make live'}
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
            onSelect={handleSelect}
            onMove={move}
            onToggle={toggle}
            onRemove={remove}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-ink-500">
              {sections.length} section{sections.length === 1 ? '' : 's'}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Expand all
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Collapse all
              </Button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="py-12 text-center text-sm text-ink-500">
                No sections yet. Add one to begin.
              </p>
            </div>
          ) : (
            sections.map((section, index) => {
              const isExpanded = expandedIds.has(section.id)
              const isSelected = section.id === selectedId
              const label =
                catalogue.find((entry) => entry.type === section.type)?.label ??
                section.type
              return (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  aria-label={label}
                  className={cn(
                    'scroll-mt-4 rounded-lg border bg-card',
                    isSelected
                      ? 'border-accent-600 ring-2 ring-accent-600/20'
                      : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`section-body-${section.id}`}
                    onClick={() => {
                      setSelectedId(section.id)
                      toggleExpanded(section.id)
                    }}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink-950">
                        {index + 1}. {label}
                      </span>
                      <span className="text-xs text-ink-500">
                        {section.isEnabled ? 'Visible' : 'Hidden'}
                      </span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-sm text-ink-500">
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div
                      id={`section-body-${section.id}`}
                      className="border-t border-border px-5 py-4"
                    >
                      <SectionForm
                        type={section.type as SectionType}
                        data={(section.data ?? {}) as Record<string, unknown>}
                        onChange={(data) => updateSectionData(section.id, data)}
                        media={media}
                        registerAsset={registerAsset}
                      />
                    </div>
                  )}
                </section>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
