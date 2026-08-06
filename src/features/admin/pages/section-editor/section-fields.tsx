'use client'

import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { cn } from '@/lib/utils'

/**
 * Field controls shared by every section form.
 *
 * The editor is deliberately constrained to the controls we provide (ADR-007):
 * copy, references and ordering — never spacing, colour or layout.
 */

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  placeholder?: string
  maxLength?: number
}) {
  const id = useId()

  return (
    <Field id={id} label={label} hint={hint}>
      {(props) => (
        <Input
          {...props}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  rows?: number
  maxLength?: number
}) {
  const id = useId()

  return (
    <Field id={id} label={label} hint={hint}>
      {(props) => (
        <Textarea
          {...props}
          rows={rows}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
}) {
  const id = useId()

  return (
    <Field id={id} label={label} hint={hint}>
      {(props) => (
        <Input
          {...props}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => {
            const next = Number(event.target.value)
            onChange(Number.isFinite(next) ? next : 0)
          }}
        />
      )}
    </Field>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const id = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm text-ink-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function LinkField({
  label,
  value,
  onChange,
}: {
  label: string
  value: { label: string; href: string } | undefined
  onChange: (value: { label: string; href: string } | undefined) => void
}) {
  const current = value ?? { label: '', href: '' }
  const isSet = Boolean(value)

  return (
    <fieldset className="rounded-md border border-border p-3">
      <legend className="px-1 text-xs font-medium text-ink-700">{label}</legend>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Button text"
          value={current.label}
          onChange={(next) => onChange({ ...current, label: next })}
        />
        <TextField
          label="Link"
          value={current.href}
          placeholder="/contact"
          onChange={(next) => onChange({ ...current, href: next })}
        />
      </div>
      {isSet && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => onChange(undefined)}
        >
          Remove link
        </Button>
      )}
    </fieldset>
  )
}

/**
 * Repeating group of sub-items (metrics, outcomes, FAQ entries).
 * Reordering is intentionally simple up/down rather than drag: these lists are
 * short, and a keyboard-accessible button beats a drag target every time.
 */
export function RepeaterField<T>({
  label,
  items,
  onChange,
  createItem,
  renderItem,
  max,
  addLabel = 'Add',
}: {
  label: string
  items: T[]
  onChange: (items: T[]) => void
  createItem: () => T
  renderItem: (item: T, update: (next: T) => void, index: number) => React.ReactNode
  max?: number
  addLabel?: string
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    if (moved !== undefined) next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          variant="secondary"
          size="sm"
          disabled={max !== undefined && items.length >= max}
          onClick={() => onChange([...items, createItem()])}
        >
          {addLabel}
        </Button>
      </div>

      {items.length === 0 && <p className="text-xs text-ink-500">Nothing added yet.</p>}

      {items.map((item, index) => (
        <div
          key={index}
          className={cn('rounded-md border border-border bg-paper-sunk p-3')}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-ink-500">#{index + 1}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move ${label} ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move ${label} ${index + 1} down`}
                disabled={index === items.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${label} ${index + 1}`}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          </div>
          {renderItem(
            item,
            (next) => onChange(items.map((value, i) => (i === index ? next : value))),
            index,
          )}
        </div>
      ))}
    </div>
  )
}
