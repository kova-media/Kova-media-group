import {
  linkHrefSchema,
  type BlockNode,
  type InlineNode,
  type RichText,
  type TextNode,
} from '@/server/content/schemas/rich-text'

/**
 * The plain-text surface the rich-text field edits, and its inverse.
 *
 * Extracted from the field component so it can be tested without a DOM, because
 * the property that matters here is not visual: **every node the schema allows
 * must survive a round trip through this file.** The previous version flattened
 * inline nodes to their bare characters, which meant opening a legal page,
 * changing one word and saving silently deleted every link on it — the link
 * node carries no `text` of its own, so it came back as nothing at all.
 *
 * The syntax is deliberately markdown-shaped, because that is what people
 * already half-know:
 *
 *   **bold**      _italic_      [label](https://example.com)
 *   [label](https://example.com "new tab")
 *
 * A backslash escapes the characters that carry meaning, so prose containing a
 * literal asterisk or bracket round-trips unchanged rather than turning into
 * formatting the author did not ask for.
 *
 * This is still not a WYSIWYG editor, and it still cannot emit anything the Zod
 * schema rejects — which is what keeps `dangerouslySetInnerHTML` out of the
 * codebase (ADR-016) and the public CSP defensible (ADR-013).
 */

const SPECIAL = /[\\*_[\]]/g

function escapeText(value: string): string {
  return value.replace(SPECIAL, (char) => `\\${char}`)
}

function textToMarkup(node: TextNode): string {
  let out = escapeText(node.text)
  // Italic inside bold, so `**_x_**` is the only ordering we ever emit and the
  // parser never has to guess which marker opened first.
  if (node.italic) out = `_${out}_`
  if (node.bold) out = `**${out}**`
  return out
}

/**
 * A line that would be re-read as a different kind of block.
 *
 * Serialising is only half the contract: the block parser looks at the start of
 * each line before any inline parsing happens, so a paragraph whose prose opens
 * with `1.`, `- `, `## ` or `>` comes back as a list, heading or quote. Escaping
 * the first character keeps the block parser off it, and `parseInline` restores
 * the literal — so the author's sentence survives being saved.
 */
const BLOCK_START = /^(#{2,4}\s|-\s|\d+\.\s|>)/

function escapeBlockStart(line: string): string {
  return BLOCK_START.test(line) ? `\\${line}` : line
}

function inlineToMarkup(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type !== 'link') return textToMarkup(node)

      const label = node.children.map(textToMarkup).join('')
      const target = node.newTab ? ' "new tab"' : ''
      return `[${label}](${node.href}${target})`
    })
    .join('')
}

export function toMarkup(nodes: RichText): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'heading':
          return `${'#'.repeat(node.level)} ${inlineToMarkup(node.children)}`
        case 'list':
          return node.items
            .map((item, index) =>
              node.ordered
                ? `${index + 1}. ${inlineToMarkup(item)}`
                : `- ${inlineToMarkup(item)}`,
            )
            .join('\n')
        case 'blockquote':
          return `> ${inlineToMarkup(node.children)}`
        default:
          return escapeBlockStart(inlineToMarkup(node.children))
      }
    })
    .join('\n\n')
}

/* ------------------------------------------------------------------ parsing */

type Marks = { bold?: boolean; italic?: boolean }

/** Index of the next unescaped occurrence of `marker`, or -1. */
function findClose(input: string, from: number, marker: string): number {
  for (let i = from; i < input.length; i += 1) {
    if (input[i] === '\\') {
      i += 1
      continue
    }
    if (input.startsWith(marker, i)) return i
  }
  return -1
}

type LinkMatch = { label: string; href: string; newTab: boolean; end: number }

/** `[label](href)` or `[label](href "new tab")`, starting at `[`. */
function matchLink(input: string, start: number): LinkMatch | null {
  const labelEnd = findClose(input, start + 1, ']')
  if (labelEnd === -1 || input[labelEnd + 1] !== '(') return null

  const targetEnd = findClose(input, labelEnd + 2, ')')
  if (targetEnd === -1) return null

  const target = input.slice(labelEnd + 2, targetEnd).trim()
  const withTab = /^(\S+)\s+"([^"]*)"$/.exec(target)

  const href = withTab ? (withTab[1] ?? '') : target
  const newTab = Boolean(withTab)

  // An unsupported scheme is left as literal text rather than becoming a node
  // the schema will reject: the editor should show the author their typo, not
  // fail the save with a message about validation.
  if (!linkHrefSchema.safeParse(href).success) return null

  return { label: input.slice(start + 1, labelEnd), href, newTab, end: targetEnd + 1 }
}

function parseInline(input: string, marks: Marks = {}): InlineNode[] {
  const out: InlineNode[] = []
  let buffer = ''

  const flush = () => {
    if (buffer.length === 0) return
    out.push({
      type: 'text',
      text: buffer,
      ...(marks.bold ? { bold: true } : {}),
      ...(marks.italic ? { italic: true } : {}),
    })
    buffer = ''
  }

  let i = 0

  while (i < input.length) {
    const char = input[i] ?? ''

    if (char === '\\' && i + 1 < input.length) {
      buffer += input[i + 1]
      i += 2
      continue
    }

    if (input.startsWith('**', i)) {
      const end = findClose(input, i + 2, '**')
      if (end !== -1) {
        flush()
        out.push(...parseInline(input.slice(i + 2, end), { ...marks, bold: true }))
        i = end + 2
        continue
      }
    }

    if (char === '_') {
      const end = findClose(input, i + 1, '_')
      if (end !== -1) {
        flush()
        out.push(...parseInline(input.slice(i + 1, end), { ...marks, italic: true }))
        i = end + 1
        continue
      }
    }

    if (char === '[') {
      const link = matchLink(input, i)
      if (link) {
        flush()
        // Link children are text nodes only, so a nested link in the label is
        // not representable — its characters are kept, its target is not.
        const children = parseInline(link.label, marks).flatMap((node) =>
          node.type === 'text' ? [node] : node.children,
        )

        out.push({
          type: 'link',
          href: link.href,
          ...(link.newTab ? { newTab: true } : {}),
          children: children.length > 0 ? children : [{ type: 'text', text: '' }],
        })
        i = link.end
        continue
      }
    }

    buffer += char
    i += 1
  }

  flush()
  return out
}

export function fromMarkup(markup: string): RichText {
  const blocks = markup.split(/\n{2,}/).filter((block) => block.trim().length > 0)
  const nodes: BlockNode[] = []

  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim().length > 0)
    const first = lines[0] ?? ''

    const heading = /^(#{2,4})\s+(.*)$/.exec(first)
    if (heading?.[1] && lines.length === 1) {
      nodes.push({
        type: 'heading',
        level: heading[1].length as 2 | 3 | 4,
        children: parseInline(heading[2] ?? ''),
      })
      continue
    }

    const isUnordered = lines.every((line) => /^-\s+/.test(line))
    const isOrdered = lines.every((line) => /^\d+\.\s+/.test(line))

    if (isUnordered || isOrdered) {
      nodes.push({
        type: 'list',
        ordered: isOrdered,
        items: lines.map((line) => parseInline(line.replace(/^(-|\d+\.)\s+/, ''))),
      })
      continue
    }

    if (lines.every((line) => line.startsWith('>'))) {
      nodes.push({
        type: 'blockquote',
        children: parseInline(lines.map((line) => line.replace(/^>\s?/, '')).join(' ')),
      })
      continue
    }

    nodes.push({ type: 'paragraph', children: parseInline(lines.join(' ')) })
  }

  return nodes
}

export const richTextMarkup = { toMarkup, fromMarkup }
