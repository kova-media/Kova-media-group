import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@/db/prisma'

import { publishPageContent, unpublishPageContent } from './mutations'
import { describeIssues, validateForPublish } from './publish'
import { toPublishedPage } from './mappers'
import { createSection, type PageContent } from './schemas/page'

/**
 * Integration coverage for the publish pipeline, against a real database
 * (CODING_STANDARDS.md §11).
 *
 * Skipped unless INTEGRATION_DB is set, so `npm test` stays hermetic and CI
 * without a database still passes:
 *
 *     INTEGRATION_DB=1 npx vitest run publish.integration
 *
 * Operates on its own throwaway page and deletes it afterwards, so it never
 * touches real content.
 */
const enabled = Boolean(process.env.INTEGRATION_DB && process.env.DATABASE_URL)

describe.skipIf(!enabled)('publish pipeline (integration)', () => {
  const slug = `zz-integration-${randomUUID().slice(0, 8)}`
  const adminId = 'integration-test'
  let pageId: string

  const completeContent: PageContent = {
    sections: [
      {
        id: randomUUID(),
        type: 'HERO',
        isEnabled: true,
        data: { headline: 'Integration headline' },
      },
    ],
  }

  beforeAll(async () => {
    const page = await prisma.page.create({
      data: { slug, title: 'Integration test page', draftContent: { sections: [] } },
      select: { id: true },
    })
    pageId = page.id
  })

  afterAll(async () => {
    await prisma.contentRevision.deleteMany({
      where: { entityType: 'page', entityId: pageId },
    })
    await prisma.page.deleteMany({ where: { id: pageId } })
    await prisma.$disconnect()
  })

  it('refuses to publish an incomplete enabled section, naming it', async () => {
    const incomplete: PageContent = {
      sections: [
        { id: randomUUID(), type: 'HERO', isEnabled: true, data: { headline: '' } },
      ],
    }

    const result = await validateForPublish(incomplete)

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0]?.sectionLabel).toBe('Hero')
    expect(describeIssues(result.issues)).toContain('Hero')
  })

  it('refuses to publish a section referencing media that does not exist', async () => {
    const broken: PageContent = {
      sections: [
        {
          id: randomUUID(),
          type: 'HERO',
          isEnabled: true,
          data: {
            headline: 'Fine headline',
            media: { mediaId: 'definitely-not-a-real-media-id' },
          },
        },
      ],
    }

    const result = await validateForPublish(broken)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(describeIssues(result.issues)).toContain('no longer exists')
  })

  // A half-built section must not block shipping the rest of the page.
  it('allows publishing when the incomplete section is disabled', async () => {
    // Built through createSection so it carries the registry defaults, exactly
    // as a section added in the editor does — then blanked to make it
    // publish-incomplete.
    const parked = createSection('CTA', randomUUID())

    const content: PageContent = {
      sections: [
        ...completeContent.sections,
        {
          ...parked,
          isEnabled: false,
          data: { ...(parked.data as Record<string, unknown>), heading: '' },
        },
      ],
    }

    // Enabled, it must block the publish...
    const enabledResult = await validateForPublish({
      sections: content.sections.map((s) => ({ ...s, isEnabled: true })),
    })
    expect(enabledResult.ok).toBe(false)

    // ...disabled, it must not.
    const result = await validateForPublish(content)
    expect(result.ok).toBe(true)
  })

  it('publishes atomically and records a revision', async () => {
    const validation = await validateForPublish(completeContent)
    expect(validation.ok).toBe(true)
    if (!validation.ok) return

    await publishPageContent(pageId, validation.content, adminId)

    const page = await prisma.page.findUniqueOrThrow({
      where: { id: pageId },
      select: { publishedContent: true, publishedAt: true, publishedBy: true },
    })

    expect(page.publishedContent).not.toBeNull()
    expect(page.publishedAt).toBeInstanceOf(Date)
    expect(page.publishedBy).toBe(adminId)

    const revisions = await prisma.contentRevision.findMany({
      where: { entityType: 'page', entityId: pageId },
    })
    expect(revisions).toHaveLength(1)
    expect(revisions[0]?.action).toBe('published')
  })

  // Note: getPublishedPage() itself cannot be exercised here — it is a
  // `'use cache'` function and cacheTag() requires the Next.js runtime. This
  // asserts the same read plus the mapper it ends in; the rendered HTTP
  // response is verified separately against the running server.
  it('reads back as a published page through the mapper', async () => {
    const row = await prisma.page.findUniqueOrThrow({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        seoTitle: true,
        seoDescription: true,
        seoImageId: true,
        seoNoIndex: true,
        publishedContent: true,
        draftContent: true,
        publishedAt: true,
      },
    })

    const published = toPublishedPage(row, 'published')

    expect(published.slug).toBe(slug)
    expect(published.isDraft).toBe(false)
    expect(published.content.sections).toHaveLength(1)
    expect((published.content.sections[0]?.data as { headline: string }).headline).toBe(
      'Integration headline',
    )
  })

  it('unpublishing removes it from the public query and records a revision', async () => {
    await unpublishPageContent(pageId, adminId)

    const page = await prisma.page.findUniqueOrThrow({
      where: { id: pageId },
      select: { publishedContent: true },
    })
    expect(page.publishedContent).toBeNull()

    const revisions = await prisma.contentRevision.findMany({
      where: { entityType: 'page', entityId: pageId },
      orderBy: { createdAt: 'desc' },
    })
    expect(revisions[0]?.action).toBe('unpublished')
  })
})
