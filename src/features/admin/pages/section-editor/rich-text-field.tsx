'use client'

import { useId, useMemo } from 'react'

import { Label, Textarea } from '@/components/ui/field'
import {
  richTextSchema,
  type BlockNode,
  type RichText,
} from '@/server/content/schemas/rich-text'

/**
 * Rich text editing.
 *
 * A plain-text surface that compiles to the structured node tree (ADR-016) —
 * *not* a WYSIWYG producing HTML. Blank lines separate blocks, `## ` and `### `
 * make headings, `- ` makes list items, `> ` makes a quote.
 *
 * This is deliberately modest for V1: it round-trips losslessly, cannot emit
 * anything the schema rejects, and keeps typography entirely under our control.
 * A richer editor can replace it later without changing the stored shape.
 */

function toMarkup(nodes: RichText): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'heading':
          return `${'#'.repeat(node.level)} ${inlineToText(node.children)}`
        case 'list':
          return node.items
            .map((item, index) =>
              node.ordered
                ? `${index + 1}. ${inlineToText(item)}`
                : `- ${inlineToText(item)}`,
            )
            .join('\n')
        case 'blockquote':
          return `> ${inlineToText(node.children)}`
        default:
          return inlineToText(node.children)
      }
    })
    .join('\n\n')
}

function inlineToText(children: { type: string; text?: string }[]): string {
  return children.map((child) => child.text ?? '').join('')
}

function fromMarkup(markup: string): RichText {
  const blocks = markup.split(/\n{2,}/).filter((block) => block.trim().length > 0)
  const nodes: BlockNode[] = []

  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim().length > 0)
    const first = lines[0] ?? ''

    const heading = /^(#{2,4})\s+(.*)$/.exec(first)
    if (heading?.[1] && lines.length === 1) {
      const level = heading[1].length as 2 | 3 | 4
      nodes.push({
        type: 'heading',
        level,
        children: [{ type: 'text', text: heading[2] ?? '' }],
      })
      continue
    }

    const isUnordered = lines.every((line) => /^-\s+/.test(line))
    const isOrdered = lines.every((line) => /^\d+\.\s+/.test(line))

    if (isUnordered || isOrdered) {
      nodes.push({
        type: 'list',
        ordered: isOrdered,
        items: lines.map((line) => [
          { type: 'text' as const, text: line.replace(/^(-|\d+\.)\s+/, '') },
        ]),
      })
      continue
    }

    if (lines.every((line) => line.startsWith('>'))) {
      nodes.push({
        type: 'blockquote',
        children: [
          {
            type: 'text',
            text: lines.map((line) => line.replace(/^>\s?/, '')).join(' '),
          },
        ],
      })
      continue
    }

    nodes.push({
      type: 'paragraph',
      children: [{ type: 'text', text: lines.join(' ') }],
    })
  }

  return nodes
}

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
      <p className="text-xs text-ink-500">
        Blank line for a new paragraph. <code>## </code> heading, <code>- </code> list,
        <code> &gt; </code> quote.
      </p>
    </div>
  )
}

export const richTextMarkup = { toMarkup, fromMarkup }
