import { describe, expect, it } from 'vitest'

import { linkHrefSchema, richTextSchema, richTextToPlainText } from './rich-text'

describe('linkHrefSchema', () => {
  it.each([
    'https://example.com',
    'http://example.com',
    'mailto:a@b.com',
    'tel:+1',
    '/work',
  ])('accepts %s', (href) => {
    expect(linkHrefSchema.safeParse(href).success).toBe(true)
  })

  // The whole reason ADR-016 exists: no scheme that can execute.
  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox',
    '//evil.example.com',
  ])('rejects %s', (href) => {
    expect(linkHrefSchema.safeParse(href).success).toBe(false)
  })
})

describe('richTextSchema', () => {
  it('accepts a well-formed document', () => {
    const result = richTextSchema.safeParse([
      { type: 'paragraph', children: [{ type: 'text', text: 'Hello', bold: true }] },
      { type: 'heading', level: 2, children: [{ type: 'text', text: 'Section' }] },
      { type: 'list', ordered: false, items: [[{ type: 'text', text: 'One' }]] },
    ])

    expect(result.success).toBe(true)
  })

  it('rejects h1 in body copy so heading levels cannot skip', () => {
    const result = richTextSchema.safeParse([
      { type: 'heading', level: 1, children: [{ type: 'text', text: 'Nope' }] },
    ])

    expect(result.success).toBe(false)
  })

  it('rejects an unknown node type', () => {
    const result = richTextSchema.safeParse([{ type: 'script', children: [] }])
    expect(result.success).toBe(false)
  })

  it('rejects an unsafe link nested in a paragraph', () => {
    const result = richTextSchema.safeParse([
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            href: 'javascript:alert(1)',
            children: [{ type: 'text', text: 'x' }],
          },
        ],
      },
    ])

    expect(result.success).toBe(false)
  })
})

describe('richTextToPlainText', () => {
  it('flattens nested inline nodes including link text', () => {
    const text = richTextToPlainText([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'See ' },
          {
            type: 'link',
            href: '/work',
            children: [{ type: 'text', text: 'our work' }],
          },
        ],
      },
      { type: 'list', ordered: true, items: [[{ type: 'text', text: 'First' }]] },
    ])

    expect(text).toBe('See our work\n\nFirst')
  })
})
