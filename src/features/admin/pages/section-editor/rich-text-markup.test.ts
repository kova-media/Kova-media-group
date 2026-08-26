import { describe, expect, it } from 'vitest'

import { richTextSchema, type RichText } from '@/server/content/schemas/rich-text'

import { fromMarkup, toMarkup } from './rich-text-markup'

/**
 * The property under test is a round trip, not a rendering.
 *
 * The editor reads a stored document, shows it as text, and turns whatever it
 * is handed back into a document again. If that cycle is lossy the loss is
 * silent and permanent: the author changes a word, saves, and the links are
 * gone with no error anywhere. So each case here goes nodes → markup → nodes
 * and asserts the nodes came back identical.
 */
function roundTrip(nodes: RichText): RichText {
  return fromMarkup(toMarkup(nodes))
}

describe('rich text round trip', () => {
  it('preserves plain text', () => {
    const nodes: RichText = [
      { type: 'paragraph', children: [{ type: 'text', text: 'Just a sentence.' }] },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves bold', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'We are ' },
          { type: 'text', text: 'specialists', bold: true },
          { type: 'text', text: '.' },
        ],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves italic', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Read the ' },
          { type: 'text', text: 'whole thing', italic: true },
          { type: 'text', text: ' first.' },
        ],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves bold and italic together on one run', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'urgent', bold: true, italic: true }],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  /** The regression this file exists for. */
  it('preserves links', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'See our ' },
          {
            type: 'link',
            href: '/privacy',
            children: [{ type: 'text', text: 'privacy policy' }],
          },
          { type: 'text', text: ' for details.' },
        ],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves every allowed link scheme', () => {
    for (const href of [
      'https://example.com/a?b=c',
      'http://example.com',
      'mailto:damian@kovamediagroup.com',
      'tel:+15551234567',
      '/case-studies/zilkee',
    ]) {
      const nodes: RichText = [
        {
          type: 'paragraph',
          children: [{ type: 'link', href, children: [{ type: 'text', text: 'go' }] }],
        },
      ]
      expect(roundTrip(nodes), href).toEqual(nodes)
    }
  })

  it('preserves a link that opens in a new tab', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            href: 'https://example.com',
            newTab: true,
            children: [{ type: 'text', text: 'External' }],
          },
        ],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves formatting inside a link label', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            href: 'https://example.com',
            children: [
              { type: 'text', text: 'read ' },
              { type: 'text', text: 'this', bold: true },
            ],
          },
        ],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves marks and links in headings, lists and quotes', () => {
    const nodes: RichText = [
      {
        type: 'heading',
        level: 2,
        children: [{ type: 'text', text: 'Your rights', bold: true }],
      },
      {
        type: 'list',
        ordered: false,
        items: [
          [
            { type: 'text', text: 'Email us at ' },
            {
              type: 'link',
              href: 'mailto:damian@kovamediagroup.com',
              children: [{ type: 'text', text: 'this address' }],
            },
          ],
          [{ type: 'text', text: 'Or write', italic: true }],
        ],
      },
      {
        type: 'blockquote',
        children: [{ type: 'text', text: 'Retention compounds.' }],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('keeps literal punctuation that would otherwise read as formatting', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Use 5 * 3, a snake_case name, and [brackets].' },
        ],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('survives being edited and round-tripped repeatedly', () => {
    const nodes: RichText = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Contact ' },
          {
            type: 'link',
            href: 'mailto:damian@kovamediagroup.com',
            children: [{ type: 'text', text: 'Damian', bold: true }],
          },
          { type: 'text', text: ' any time.' },
        ],
      },
    ]

    // Three saves in a row is the case that used to lose everything.
    expect(roundTrip(roundTrip(roundTrip(nodes)))).toEqual(nodes)
  })

  it('leaves an unsupported scheme as visible text rather than dropping it', () => {
    // Nothing is silently deleted, and nothing invalid reaches the schema.
    const parsed = fromMarkup('[click](javascript:alert(1))')
    expect(richTextSchema.safeParse(parsed).success).toBe(true)
    expect(JSON.stringify(parsed)).toContain('javascript')
    expect(JSON.stringify(parsed)).not.toContain('"type":"link"')
  })

  it('preserves ordered lists', () => {
    const nodes: RichText = [
      {
        type: 'list',
        ordered: true,
        items: [
          [{ type: 'text', text: 'Audit the account' }],
          [
            { type: 'text', text: 'Agree the ' },
            { type: 'text', text: 'plan', bold: true },
          ],
          [{ type: 'text', text: 'Ship it' }],
        ],
      },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves every heading level the schema allows', () => {
    const nodes: RichText = ([2, 3, 4] as const).map((level) => ({
      type: 'heading' as const,
      level,
      children: [{ type: 'text' as const, text: `Level ${level}` }],
    }))
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('preserves a document using every block type at once', () => {
    const nodes: RichText = [
      { type: 'heading', level: 2, children: [{ type: 'text', text: 'Terms' }] },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'By using this site you agree to our ' },
          {
            type: 'link',
            href: '/privacy',
            children: [{ type: 'text', text: 'privacy policy' }],
          },
          { type: 'text', text: '.' },
        ],
      },
      { type: 'heading', level: 3, children: [{ type: 'text', text: 'Your data' }] },
      {
        type: 'list',
        ordered: false,
        items: [
          [{ type: 'text', text: 'We keep it', italic: true }],
          [{ type: 'text', text: 'We do not sell it', bold: true }],
        ],
      },
      {
        type: 'list',
        ordered: true,
        items: [[{ type: 'text', text: 'Ask' }], [{ type: 'text', text: 'Receive' }]],
      },
      { type: 'blockquote', children: [{ type: 'text', text: 'Plain and short.' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'Closing line.' }] },
    ]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  /**
   * Prose that opens the way a list, heading or quote opens.
   *
   * The block parser reads the start of the line before any inline parsing, so
   * without escaping these sentences come back as an entirely different kind of
   * block — silently, on save.
   */
  it.each([
    ['numbered', '1. This is prose, not a list'],
    ['dash', '- not a bullet'],
    ['hash', '## not a heading'],
    ['angle', '> not a quote'],
  ])('keeps a paragraph that opens like a %s block', (_name, text) => {
    const nodes: RichText = [{ type: 'paragraph', children: [{ type: 'text', text }] }]
    expect(roundTrip(nodes)).toEqual(nodes)
  })

  it('produces documents the schema accepts', () => {
    const markup = [
      '## Heading with **bold**',
      '',
      'A paragraph with _italic_ and a [link](https://example.com "new tab").',
      '',
      '- one',
      '- two with **weight**',
      '',
      '> a quote',
    ].join('\n')

    expect(richTextSchema.safeParse(fromMarkup(markup)).success).toBe(true)
  })
})
