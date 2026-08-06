import { describe, expect, it } from 'vitest'

import { derivePageStatus } from './mappers'

/**
 * Liveness is derived, never stored (DATABASE.md §4.2). These cases are the
 * whole contract, so they are worth pinning down.
 */
describe('derivePageStatus', () => {
  const published = new Date('2026-01-01T10:00:00Z')

  it('reports DRAFT when never published', () => {
    expect(
      derivePageStatus({
        publishedContent: null,
        publishedAt: null,
        updatedAt: published,
      }),
    ).toBe('DRAFT')
  })

  it('distinguishes UNPUBLISHED from never-published', () => {
    expect(
      derivePageStatus({
        publishedContent: null,
        publishedAt: published,
        updatedAt: published,
      }),
    ).toBe('UNPUBLISHED')
  })

  it('reports LIVE when the draft has not moved since publishing', () => {
    expect(
      derivePageStatus({
        publishedContent: { sections: [] },
        publishedAt: published,
        updatedAt: published,
      }),
    ).toBe('LIVE')
  })

  it('reports LIVE_WITH_CHANGES when the draft is newer', () => {
    expect(
      derivePageStatus({
        publishedContent: { sections: [] },
        publishedAt: published,
        updatedAt: new Date('2026-01-02T10:00:00Z'),
      }),
    ).toBe('LIVE_WITH_CHANGES')
  })

  it('treats undefined publishedContent the same as null', () => {
    expect(
      derivePageStatus({
        publishedContent: undefined,
        publishedAt: null,
        updatedAt: published,
      }),
    ).toBe('DRAFT')
  })
})
