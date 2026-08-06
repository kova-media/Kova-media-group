'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { SectionType } from '@/server/content/sections/types'

import type { SectionMeta } from './section-list'

/**
 * Add-section list, built from the registry (ADR-007). The editor picks from
 * designed section types; there is no path to inventing a new layout.
 */
export function AddSectionMenu({
  catalogue,
  disabled,
  onAdd,
}: {
  catalogue: SectionMeta[]
  disabled: boolean
  onAdd: (type: SectionType) => void
}) {
  const [isOpen, setOpen] = useState(false)

  return (
    <div className="rounded-md border border-border bg-card">
      <Button
        variant="secondary"
        size="md"
        className="w-full"
        disabled={disabled}
        aria-expanded={isOpen}
        onClick={() => setOpen((current) => !current)}
      >
        {isOpen ? 'Close' : 'Add section'}
      </Button>

      {isOpen && (
        <ul className="max-h-80 overflow-y-auto border-t border-border p-1">
          {catalogue.map((entry) => (
            <li key={entry.type}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setOpen(false)
                  onAdd(entry.type as SectionType)
                }}
                className="w-full rounded px-3 py-2 text-left hover:bg-ink-50 disabled:opacity-50"
              >
                <span className="block text-sm font-medium text-ink-900">
                  {entry.label}
                </span>
                <span className="block text-xs text-ink-500">{entry.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
