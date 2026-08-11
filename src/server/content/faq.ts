import 'server-only'

import { faqs as fallbackFaqs } from '@/lib/site-data'

import { getPublishedPage } from './queries'
import type { RichText } from './schemas/rich-text'

/**
 * The FAQ, read from the CMS page at `/faq`.
 *
 * The FAQ is authored with the section editor that already exists rather than
 * getting a bespoke table — it is a list of questions on a page, which is
 * precisely what the FAQ section type models.
 *
 * The homepage renders answers as plain text (the design is an accordion of
 * short paragraphs), so the rich-text tree is flattened here. Anything richer
 * than paragraphs would be lost, which is why the editor's FAQ answers are
 * meant to stay short.
 */
export type FaqItem = { q: string; a: string }

function flatten(nodes: RichText): string {
  return nodes
    .map((node) => {
      if (node.type === 'list') {
        return node.items
          .map((item) => item.map((inline) => inlineText(inline)).join(''))
          .join(' ')
      }

      return 'children' in node
        ? node.children.map((inline) => inlineText(inline)).join('')
        : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function inlineText(node: { type: string; text?: string; children?: unknown }): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.children)) {
    return (node.children as { type: string; text?: string }[])
      .map((child) => inlineText(child))
      .join('')
  }
  return ''
}

export async function getFaqItems(): Promise<FaqItem[]> {
  const page = await getPublishedPage('faq')

  if (!page) return fallbackFaqs

  const section = page.content.sections.find(
    (candidate) => candidate.type === 'FAQ' && candidate.isEnabled,
  )

  if (!section) return fallbackFaqs

  const data = (section.data ?? {}) as { items?: unknown }
  const items = Array.isArray(data.items) ? data.items : []

  const mapped = items
    .filter((item): item is { question: string; answer: RichText } =>
      Boolean(item && typeof item === 'object'),
    )
    .map((item) => ({
      q: typeof item.question === 'string' ? item.question : '',
      a: Array.isArray(item.answer) ? flatten(item.answer) : '',
    }))
    .filter((item) => item.q && item.a)

  return mapped.length > 0 ? mapped : fallbackFaqs
}
