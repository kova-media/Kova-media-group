'use client'

import { useMemo, useState } from 'react'

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

  // The catalogue is long enough that a flat list buries the designed bands
  // under the utility ones. Grouping is presentation only — order within a
  // group is still the registry's.
  const groups = useMemo(() => {
    const byGroup = new Map<string, SectionMeta[]>()
    for (const entry of catalogue) {
      const existing = byGroup.get(entry.group)
      if (existing) existing.push(entry)
      else byGroup.set(entry.group, [entry])
    }
    return [...byGroup.entries()]
  }, [catalogue])

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
        <div className="max-h-96 overflow-y-auto border-t border-border p-1">
          {groups.map(([group, entries]) => (
            <section key={group}>
              <h3 className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-ink-500 uppercase">
                {group}
              </h3>
              <ul>
                {entries.map((entry) => (
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
                      <span className="block text-xs text-ink-500">
                        {entry.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
