import { describe, expect, it } from 'vitest'

import { derivePageStatus } from './mappers'

/**
 * Liveness is derived, never stored (DATABASE.md §4.2). These cases are the
 * whole contract, so they are worth pinning down.
 *
 * "Has unpublished changes" is decided by comparing the two documents, not the
 * two timestamps. Publishing writes `publishedAt` from the application clock
 * and `updatedAt` from the database a few milliseconds later, so a timestamp
 * comparison marked every page as edited the instant it went live.
 */
describe('derivePageStatus', () => {
  const published = new Date('2026-01-01T10:00:00Z')

  it('reports DRAFT when never published', () => {
    expect(
      derivePageStatus({
        draftContent: { sections: [] },
        publishedContent: null,
        publishedAt: null,
        updatedAt: published,
      }),
    ).toBe('DRAFT')
  })

  it('distinguishes UNPUBLISHED from never-published', () => {
    expect(
      derivePageStatus({
        draftContent: { sections: [] },
        publishedContent: null,
        publishedAt: published,
        updatedAt: published,
      }),
    ).toBe('UNPUBLISHED')
  })

  it('reports LIVE when the draft matches what is published', () => {
    expect(
      derivePageStatus({
        draftContent: { sections: [] },
        publishedContent: { sections: [] },
        publishedAt: published,
        // A write moments after publishing must not flag the page.
        updatedAt: new Date('2026-01-01T10:00:00.058Z'),
      }),
    ).toBe('LIVE')
  })

  it('reports LIVE_WITH_CHANGES when the draft differs', () => {
    expect(
      derivePageStatus({
        draftContent: { sections: [{ id: 'a' }] },
        publishedContent: { sections: [] },
        publishedAt: published,
        updatedAt: new Date('2026-01-02T10:00:00Z'),
      }),
    ).toBe('LIVE_WITH_CHANGES')
  })

  it('treats undefined publishedContent the same as null', () => {
    expect(
      derivePageStatus({
        draftContent: { sections: [] },
        publishedContent: undefined,
        publishedAt: null,
        updatedAt: published,
      }),
    ).toBe('DRAFT')
  })
})
