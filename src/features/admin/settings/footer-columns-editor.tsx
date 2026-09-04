'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/field'
import type { FooterColumn } from '@/server/content/schemas/settings'

/**
 * The footer's link columns.
 *
 * Two levels of nesting — columns, each holding links — which is one level more
 * than repeated form fields can express without an index-encoding scheme that
 * breaks the first time a row is removed. So the editor holds the columns in
 * state and serialises them into one hidden field on submit. The person using
 * it sees labelled boxes and never a bracket; the JSON is transport, not an
 * interface.
 */
export function FooterColumnsEditor({ columns }: { columns: FooterColumn[] }) {
  const [value, setValue] = useState<FooterColumn[]>(columns)

  const updateColumn = (index: number, next: FooterColumn) =>
    setValue(value.map((column, i) => (i === index ? next : column)))

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const next = [...value]
    const [moved] = next.splice(from, 1)
    if (moved) next.splice(to, 0, moved)
    setValue(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="footerColumns" value={JSON.stringify(value)} />

      <div className="flex items-center justify-between">
        <Label>Link columns</Label>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setValue([...value, { heading: '', links: [] }])}
        >
          Add column
        </Button>
      </div>

      <p className="-mt-1 text-xs text-ink-500">
        Type <code className="font-mono">mailto:</code> on its own as a link to point at
        the contact email above — it then stays in step if that address changes.
      </p>

      {value.length === 0 && (
        <p className="text-xs text-ink-500">
          No columns — the footer falls back to its defaults.
        </p>
      )}

      {value.map((column, index) => (
        <fieldset key={index} className="rounded-md border border-border p-3">
          <legend className="px-1 text-xs font-medium text-ink-700">
            Column {index + 1}
          </legend>

          <div className="flex items-center gap-2">
            <Input
              value={column.heading}
              aria-label={`Column ${index + 1} heading`}
              placeholder="Company"
              maxLength={40}
              onChange={(event) =>
                updateColumn(index, { ...column, heading: event.target.value })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Move column ${index + 1} left`}
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Move column ${index + 1} right`}
              disabled={index === value.length - 1}
              onClick={() => move(index, index + 1)}
            >
              →
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove column ${index + 1}`}
              onClick={() => setValue(value.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {column.links.map((link, linkIndex) => (
              <div key={linkIndex} className="flex items-center gap-2">
                <Input
                  value={link.label}
                  aria-label={`Column ${index + 1} link ${linkIndex + 1} text`}
                  placeholder="Services"
                  maxLength={60}
                  onChange={(event) =>
                    updateColumn(index, {
                      ...column,
                      links: column.links.map((item, i) =>
                        i === linkIndex ? { ...item, label: event.target.value } : item,
                      ),
                    })
                  }
                />
                <Input
                  value={link.href}
                  aria-label={`Column ${index + 1} link ${linkIndex + 1} target`}
                  placeholder="/services"
                  maxLength={300}
                  onChange={(event) =>
                    updateColumn(index, {
                      ...column,
                      links: column.links.map((item, i) =>
                        i === linkIndex ? { ...item, href: event.target.value } : item,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove column ${index + 1} link ${linkIndex + 1}`}
                  onClick={() =>
                    updateColumn(index, {
                      ...column,
                      links: column.links.filter((_, i) => i !== linkIndex),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}

            <div>
              <Button
                variant="secondary"
                size="sm"
                disabled={column.links.length >= 8}
                onClick={() =>
                  updateColumn(index, {
                    ...column,
                    links: [...column.links, { label: '', href: '' }],
                  })
                }
              >
                Add link
              </Button>
            </div>
          </div>
        </fieldset>
      ))}
    </div>
  )
}
