import { describe, expect, it } from 'vitest'

import { parseSiteFooter, siteFooterSchema } from './settings'

describe('siteFooterSchema', () => {
  it('accepts more than four footer columns', () => {
    const columns = Array.from({ length: 25 }, (_, index) => ({
      heading: `Column ${index + 1}`,
      links: [],
    }))

    const result = siteFooterSchema.safeParse({
      description: '',
      tagline: '',
      note: '',
      columns,
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.columns).toHaveLength(25)
  })

  it('preserves an expanded footer through parsing', () => {
    const columns = Array.from({ length: 12 }, (_, index) => ({
      heading: `Column ${index + 1}`,
      links: [{ label: 'Link', href: `/page-${index + 1}` }],
    }))

    expect(parseSiteFooter({ description: '', tagline: '', note: '', columns })).toEqual({
      description: '',
      tagline: '',
      note: '',
      columns,
    })
  })
})
