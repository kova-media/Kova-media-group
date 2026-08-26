'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ValidatedSection } from '@/server/content/sections/registry'

export type SectionMeta = {
  type: string
  label: string
  description: string
  group: string
}

/**
 * Reorder, enable/disable, select and remove.
 *
 * Reordering is explicit up/down buttons rather than drag-and-drop. Pages hold
 * a few dozen sections at most, buttons are keyboard-accessible for free, and
 * dragging a tall list inside a scrolling panel is worse than it looks in a
 * demo. Drag can be layered on later without changing the data.
 */
export function SectionList({
  sections,
  catalogue,
  selectedId,
  onSelect,
  onMove,
  onToggle,
  onRemove,
}: {
  sections: ValidatedSection[]
  catalogue: SectionMeta[]
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const labelFor = (type: string) =>
    catalogue.find((entry) => entry.type === type)?.label ?? type

  if (sections.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-ink-500">
        No sections yet. Add one to begin.
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {sections.map((section, index) => {
        const isSelected = section.id === selectedId

        return (
          <li key={section.id}>
            <div
              className={cn(
                'rounded-md border border-border bg-card transition-colors',
                isSelected && 'border-accent-600 ring-2 ring-accent-600/20',
                !section.isEnabled && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-2 p-2">
                <button
                  type="button"
                  onClick={() => onSelect(section.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <span className="block truncate text-sm font-medium text-ink-900">
                    {labelFor(section.type)}
                  </span>
                  <span className="text-xs text-ink-500">
                    {section.isEnabled ? 'Visible' : 'Hidden'}
                  </span>
                </button>

                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${labelFor(section.type)} up`}
                    disabled={index === 0}
                    onClick={() => onMove(section.id, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${labelFor(section.type)} down`}
                    disabled={index === sections.length - 1}
                    onClick={() => onMove(section.id, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={section.isEnabled}
                    onClick={() => onToggle(section.id)}
                  >
                    {section.isEnabled ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>

              {confirmingId === section.id ? (
                <div className="flex items-center justify-between gap-2 border-t border-border bg-paper-sunk px-2 py-1.5">
                  <span className="text-xs text-ink-600">Remove this section?</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        onRemove(section.id)
                        setConfirmingId(null)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingId(section.id)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
