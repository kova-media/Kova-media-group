'use client'

import { useId, useMemo } from 'react'

import { Label, Textarea } from '@/components/ui/field'
import { richTextSchema, type RichText } from '@/server/content/schemas/rich-text'

import { fromMarkup, toMarkup } from './rich-text-markup'

/**
 * Rich text editing.
 *
 * A plain-text surface that compiles to the structured node tree (ADR-016) —
 * *not* a WYSIWYG producing HTML. The conversion lives in `rich-text-markup.ts`
 * so it can be tested for the property that actually matters: everything the
 * schema allows survives a round trip. It previously did not, and links were
 * being deleted on save.
 */
export function RichTextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (value: RichText) => void
}) {
  const id = useId()

  const markup = useMemo(() => {
    const parsed = richTextSchema.safeParse(value)
    return parsed.success ? toMarkup(parsed.data) : ''
  }, [value])

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={8}
        defaultValue={markup}
        onChange={(event) => onChange(fromMarkup(event.target.value))}
        className="font-mono text-xs"
      />
      <p className="text-xs leading-relaxed text-ink-500">
        Blank line starts a new paragraph. <code>**bold**</code>, <code>_italic_</code>,{' '}
        <code>[text](https://example.com)</code> for a link. <code>## </code> heading,{' '}
        <code>- </code> list, <code>&gt; </code> quote. Put a <code>\</code> before a
        character to keep it literal.
      </p>
    </div>
  )
}

export { richTextMarkup } from './rich-text-markup'
