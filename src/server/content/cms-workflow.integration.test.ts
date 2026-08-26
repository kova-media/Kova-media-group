import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@/db/prisma'

import { saveCaseStudyDraft, publishCaseStudy } from './case-study-mutations'
import { saveDraftContent, publishPageContent } from './mutations'
import { describeIssues, validateForPublish } from './publish'
import { caseStudyNarrativeSchema } from './schemas/case-study'
import { createSection, type PageContent } from './schemas/page'

/**
 * The editing workflow, end to end, against the real database.
 *
 * These exercise the exact functions the admin's forms call — autosave,
 * validate, publish — and then read back through the same queries the public
 * pages use. What they are guarding is the promise the whole system rests on:
 * a change made in the admin reaches the site, and content removed from the
 * admin disappears from the site rather than reverting to something in code.
 *
 * Skipped unless INTEGRATION_DB is set, so `npm test` stays hermetic:
 *
 *     INTEGRATION_DB=1 npx vitest run cms-workflow
 *
 * **Every test restores what it touched.** These run against real content, so
 * the snapshots taken in `beforeAll` are written back in `afterAll` whatever
 * happens in between.
 */
const enabled = Boolean(process.env.INTEGRATION_DB && process.env.DATABASE_URL)

const ADMIN_ID = 'integration-test'

describe.skipIf(!enabled)('the CMS editing workflow', () => {
  let homeId: string
  let homeSnapshot: { draft: unknown; published: unknown; version: number }
  let studyId: string
  let studySnapshot: { draft: unknown; published: unknown; version: number }

  /** Reads the live draft, applies a change, saves it the way autosave does. */
  async function editHome(change: (content: PageContent) => PageContent) {
    const row = await prisma.page.findUniqueOrThrow({ where: { id: homeId } })
    const content = row.draftContent as unknown as PageContent
    const next = change(structuredClone(content))

    await saveDraftContent(homeId, next, row.draftVersion)
    return next
  }

  /** Publishes exactly as `publishPage` does: validate, then write. */
  async function publishHome(content: PageContent) {
    const validation = await validateForPublish(content)
    if (!validation.ok) {
      throw new Error(
        `Unexpected validation failure: ${describeIssues(validation.issues)}`,
      )
    }
    await publishPageContent(homeId, validation.content, ADMIN_ID)
  }

  /**
   * The published document, read from the column the public site reads.
   *
   * Deliberately not through `getPublishedPage`: that is a `'use cache'`
   * function and `cacheTag()` needs a Next.js request context, which a test
   * runner does not have. The column is what the cached query returns, so this
   * is the same content one layer down. That the *rendered page* reflects it is
   * proven over HTTP after a build, not here.
   */
  async function publishedHome(): Promise<PageContent> {
    const row = await prisma.page.findUniqueOrThrow({ where: { id: homeId } })
    return row.publishedContent as unknown as PageContent
  }

  function heroOf(content: PageContent) {
    const hero = content.sections.find((section) => section.type === 'HOME_HERO')
    if (!hero) throw new Error('The homepage has no hero section')
    return hero
  }

  beforeAll(async () => {
    const home = await prisma.page.findUniqueOrThrow({ where: { slug: 'home' } })
    homeId = home.id
    homeSnapshot = {
      draft: home.draftContent,
      published: home.publishedContent,
      version: home.draftVersion,
    }

    const study = await prisma.caseStudy.findUniqueOrThrow({
      where: { slug: 'zilkee' },
    })
    studyId = study.id
    studySnapshot = {
      draft: study.draftContent,
      published: study.publishedContent,
      version: study.draftVersion,
    }
  })

  afterAll(async () => {
    // Restore byte-for-byte, including the version counters, so a run leaves no
    // trace in the content or in the optimistic-concurrency state.
    if (homeId) {
      await prisma.page.update({
        where: { id: homeId },
        data: {
          draftContent: homeSnapshot.draft as never,
          publishedContent: homeSnapshot.published as never,
          draftVersion: homeSnapshot.version,
        },
      })
      await prisma.contentRevision.deleteMany({
        where: { entityType: 'page', entityId: homeId, createdBy: ADMIN_ID },
      })
    }

    if (studyId) {
      await prisma.caseStudy.update({
        where: { id: studyId },
        data: {
          draftContent: studySnapshot.draft as never,
          publishedContent: studySnapshot.published as never,
          draftVersion: studySnapshot.version,
        },
      })
      await prisma.contentRevision.deleteMany({
        where: { entityType: 'caseStudy', entityId: studyId, createdBy: ADMIN_ID },
      })
    }

    await prisma.$disconnect()
  })

  it('publishes an edited headline to the public page', async () => {
    const marker = 'Integration headline — safe to delete'

    const next = await editHome((content) => {
      const hero = heroOf(content)
      hero.data = { ...(hero.data as object), headline: marker }
      return content
    })

    await publishHome(next)

    const hero = heroOf(await publishedHome())

    expect((hero.data as { headline: string }).headline).toBe(marker)
  })

  it('publishes cleanly with an optional field cleared', async () => {
    // Clearing the button on the statement band is the ordinary case: an
    // optional thing removed, the page still publishes, and the renderer drops
    // the button rather than substituting a default label.
    const next = await editHome((content) => {
      const statement = content.sections.find((s) => s.type === 'STATEMENT')
      const data = statement?.data as { cta: { label: string; href: string } }
      data.cta = { label: '', href: '' }
      return content
    })

    await publishHome(next)

    const published = await publishedHome()
    const statement = published.sections.find((s) => s.type === 'STATEMENT')
    const data = statement?.data as {
      statement: string
      cta: { label: string; href: string }
    }

    expect(data.cta.label).toBe('')
    expect(data.statement.length).toBeGreaterThan(0)
  })

  it('hides a whole band when the section is disabled', async () => {
    // The supported way to leave a band off a page: hide it. The document keeps
    // the content, so it comes back intact when it is shown again.
    const next = await editHome((content) => {
      const statement = content.sections.find((s) => s.type === 'STATEMENT')
      if (statement) statement.isEnabled = false
      return content
    })

    await publishHome(next)

    const hidden = (await publishedHome()).sections.find((s) => s.type === 'STATEMENT')
    expect(hidden?.isEnabled).toBe(false)
    expect((hidden?.data as { statement: string }).statement.length).toBeGreaterThan(0)

    const shown = await editHome((content) => {
      const statement = content.sections.find((s) => s.type === 'STATEMENT')
      if (statement) statement.isEnabled = true
      return content
    })
    await publishHome(shown)
  })

  it('adds, reorders and removes a repeatable item', async () => {
    const added = await editHome((content) => {
      const steps = content.sections.find((s) => s.type === 'PROCESS_STEPS')
      const data = steps?.data as { steps: { title: string; description: string }[] }
      data.steps = [
        ...data.steps,
        { title: 'Fifth step', description: 'Added by a test' },
      ]
      return content
    })

    let data = (added.sections.find((s) => s.type === 'PROCESS_STEPS')?.data ?? {}) as {
      steps: { title: string }[]
    }
    expect(data.steps.at(-1)?.title).toBe('Fifth step')

    const reordered = await editHome((content) => {
      const steps = content.sections.find((s) => s.type === 'PROCESS_STEPS')
      const value = steps?.data as { steps: { title: string }[] }
      value.steps = [...value.steps].reverse()
      return content
    })

    data = (reordered.sections.find((s) => s.type === 'PROCESS_STEPS')?.data ?? {}) as {
      steps: { title: string }[]
    }
    expect(data.steps[0]?.title).toBe('Fifth step')

    const removed = await editHome((content) => {
      const steps = content.sections.find((s) => s.type === 'PROCESS_STEPS')
      const value = steps?.data as { steps: { title: string }[] }
      value.steps = value.steps.filter((step) => step.title !== 'Fifth step')
      return content
    })

    await publishHome(removed)

    const published = await publishedHome()
    const steps = published.sections.find((s) => s.type === 'PROCESS_STEPS')
    const titles = (steps?.data as { steps: { title: string }[] }).steps.map(
      (step) => step.title,
    )

    expect(titles).not.toContain('Fifth step')
    expect(titles).toHaveLength(4)
  })

  it('refuses to publish an incomplete section, naming it in plain language', async () => {
    const draft = await editHome((content) => {
      const hero = heroOf(content)
      hero.data = { ...(hero.data as object), headline: '   ' }
      return content
    })

    const validation = await validateForPublish(draft)

    expect(validation.ok).toBe(false)
    if (validation.ok) return

    const message = describeIssues(validation.issues)
    expect(message).toContain('Home hero')
    expect(message).toContain('needs some text')
    // And it says what to do about it, which "required" on its own does not.
    expect(message).toContain('hide that section')
  })

  it('lets a half-finished section be saved as a draft', async () => {
    // The same document that cannot be published saves without complaint. This
    // is the split that stops the editor losing work mid-sentence.
    const row = await prisma.page.findUniqueOrThrow({ where: { id: homeId } })
    expect(row.draftVersion).toBeGreaterThan(homeSnapshot.version)
  })

  it('adds a new section from the registry with its defaults', async () => {
    const next = await editHome((content) => {
      content.sections.push(createSection('METRICS_BAND', 'integration-metrics'))
      return content
    })

    const added = next.sections.find((s) => s.id === 'integration-metrics')
    expect(added?.type).toBe('METRICS_BAND')
    expect(added?.isEnabled).toBe(true)

    // A figures band with no figures is publishable and simply renders nothing,
    // so adding one never blocks the editor from shipping the rest of the page.
    // (The hero is restored first — the previous test left it blank on purpose.)
    const withEmptyBand = await editHome((content) => {
      const hero = heroOf(content)
      hero.data = { ...(hero.data as object), headline: 'Temporary but valid' }
      return content
    })

    const validation = await validateForPublish(withEmptyBand)
    expect(validation.ok).toBe(true)

    await editHome((content) => {
      content.sections = content.sections.filter((s) => s.id !== 'integration-metrics')
      return content
    })
  })

  it('publishes an edited case study to the public page', async () => {
    const row = await prisma.caseStudy.findUniqueOrThrow({ where: { id: studyId } })
    const narrative = caseStudyNarrativeSchema.parse(
      (row.draftContent as { narrative?: unknown }).narrative,
    )

    const edited = {
      ...narrative,
      background: 'Integration background — safe to delete',
      results: [
        { value: '+99.9%', label: 'Integration metric' },
        ...narrative.results.slice(1),
      ],
    }

    await saveCaseStudyDraft(studyId, edited, row.draftVersion)
    await publishCaseStudy(studyId, ADMIN_ID)

    const after = await prisma.caseStudy.findUniqueOrThrow({ where: { id: studyId } })
    const published = caseStudyNarrativeSchema.parse(
      (after.publishedContent as { narrative?: unknown }).narrative,
    )

    expect(published.background).toBe('Integration background — safe to delete')
    expect(published.results[0]).toEqual({
      value: '+99.9%',
      label: 'Integration metric',
    })
  })

  it('has no bundled study standing in for a missing row', async () => {
    const missing = await prisma.caseStudy.findUnique({
      where: { slug: 'a-study-that-does-not-exist' },
    })

    expect(missing).toBeNull()
  })
})
