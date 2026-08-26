import { config as loadEnv } from 'dotenv'

import { PrismaPg } from '@prisma/adapter-pg'

// The Prisma CLI does not read .env.local the way Next.js does.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { PrismaClient } from '../src/generated/prisma/client'
import type { Prisma } from '../src/generated/prisma/client'
import { caseStudies } from '../src/lib/site-data'
import { PAGE_BLUEPRINTS } from '../src/server/content/blueprints'
import {
  DEFAULT_SITE_FOOTER,
  DEFAULT_SITE_HEADER,
} from '../src/server/content/schemas/settings'
import { SECTION_TYPES } from '../src/server/content/sections/types'

/**
 * Puts the real Kova content into the CMS.
 *
 * The bundled copy in `blueprints.ts` and `site-data.ts` stays in the
 * repository as the floor the public site renders from when a table is empty —
 * a fresh clone or preview environment still shows a complete site. This script
 * promotes that content into the database so the owner can edit every word of
 * it from the admin without touching code.
 *
 * **Idempotent, and it never overwrites an edit made in the admin.** A page is
 * written only when it does not exist, or when the document it holds contains
 * none of the designed marketing sections — which is true exactly once, for the
 * placeholder documents left over from before the marketing pages were
 * CMS-driven. After that the database is authoritative and this script is a
 * no-op.
 */
const connectionString = process.env['DIRECT_URL']

if (!connectionString) {
  throw new Error('DIRECT_URL is required to seed.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const SEED_AUTHOR = 'seed:content'

/** The designed bands. A document holding none of them predates this system. */
const MARKETING_TYPES = new Set<string>(
  SECTION_TYPES.slice(0, SECTION_TYPES.indexOf('HERO')),
)

function isMarketingDocument(value: unknown): boolean {
  const sections = (value as { sections?: unknown })?.sections
  if (!Array.isArray(sections)) return false

  return sections.some((section) =>
    MARKETING_TYPES.has((section as { type?: string })?.type ?? ''),
  )
}

async function seedCaseStudies() {
  let created = 0

  for (const [index, study] of caseStudies.entries()) {
    const existing = await prisma.caseStudy.findUnique({
      where: { slug: study.slug },
      select: { id: true },
    })

    if (existing) continue

    const content = {
      sections: [],
      metrics: [],
      narrative: {
        background: study.background,
        challenge: study.challenge,
        strategy: study.strategy,
        design: study.design,
        automation: study.automation,
        sms: study.sms,
        results: study.results,
        resultsPeriod: study.resultsPeriod ?? '',
        accent: study.accent,
      },
    }

    // Seeded live: these are the real, already-public case studies, and a site
    // that ships with an empty work section is worse than one that ships with
    // the content it already has. Editing and republishing works normally.
    const row = await prisma.caseStudy.create({
      data: {
        slug: study.slug,
        clientName: study.brand,
        headline: study.summary.split('.')[0] ?? study.brand,
        summary: study.summary,
        industry: study.category,
        isFeatured: index < 3,
        position: index,
        draftContent: content,
        publishedContent: content,
        publishedAt: new Date(),
        publishedBy: SEED_AUTHOR,
        seoTitle: `${study.brand} case study`,
        seoDescription: study.summary,
      },
      select: { id: true },
    })

    await prisma.contentRevision.create({
      data: {
        entityType: 'caseStudy',
        entityId: row.id,
        content,
        action: 'published',
        createdBy: SEED_AUTHOR,
      },
    })

    created += 1
  }

  return created
}

/**
 * The designed marketing pages.
 *
 * Seeded published, because these pages are already live — the site rendered
 * this exact copy from the components before it was content. Publishing them as
 * drafts would take the marketing site down until someone pressed a button.
 */
async function seedMarketingPages() {
  const written: string[] = []
  const skipped: string[] = []

  for (const blueprint of PAGE_BLUEPRINTS) {
    const existing = await prisma.page.findUnique({
      where: { slug: blueprint.slug },
      select: { id: true, draftContent: true, publishedContent: true },
    })

    if (
      existing &&
      (isMarketingDocument(existing.draftContent) ||
        isMarketingDocument(existing.publishedContent))
    ) {
      skipped.push(blueprint.slug)
      continue
    }

    // Prisma's JSON input type wants an index signature; the document has a
    // typed shape. It is validated by `pageContentSchema` on every read, so the
    // cast here is at the database boundary only.
    const content = blueprint.content as unknown as Prisma.InputJsonValue
    const now = new Date()

    const row = existing
      ? await prisma.page.update({
          where: { id: existing.id },
          data: {
            title: blueprint.title,
            isSystem: true,
            draftContent: content,
            publishedContent: content,
            publishedAt: now,
            publishedBy: SEED_AUTHOR,
            draftVersion: { increment: 1 },
            seoTitle: blueprint.seoTitle,
            seoDescription: blueprint.seoDescription,
          },
          select: { id: true },
        })
      : await prisma.page.create({
          data: {
            slug: blueprint.slug,
            title: blueprint.title,
            // System pages own a real route file, so their slug is structural
            // and the admin must not let anyone change it.
            isSystem: true,
            draftContent: content,
            publishedContent: content,
            publishedAt: now,
            publishedBy: SEED_AUTHOR,
            seoTitle: blueprint.seoTitle,
            seoDescription: blueprint.seoDescription,
          },
          select: { id: true },
        })

    await prisma.contentRevision.create({
      data: {
        entityType: 'page',
        entityId: row.id,
        content,
        action: 'published',
        createdBy: SEED_AUTHOR,
      },
    })

    written.push(blueprint.slug)
  }

  return { written, skipped }
}

/**
 * Header and footer content.
 *
 * Written only when the blobs are still empty, so a footer edited in the admin
 * survives a re-run.
 */
async function seedChrome() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'singleton' },
    select: { header: true, footer: true },
  })

  if (!settings) return false

  const footer = (settings.footer ?? {}) as Record<string, unknown>
  const header = (settings.header ?? {}) as Record<string, unknown>

  const needsFooter = !Array.isArray(footer['columns'])
  const needsHeader = typeof header['ctaLabel'] !== 'string'

  if (!needsFooter && !needsHeader) return false

  await prisma.siteSettings.update({
    where: { id: 'singleton' },
    data: {
      ...(needsHeader
        ? { header: DEFAULT_SITE_HEADER as unknown as Prisma.InputJsonValue }
        : {}),
      ...(needsFooter
        ? { footer: DEFAULT_SITE_FOOTER as unknown as Prisma.InputJsonValue }
        : {}),
    },
  })

  return true
}

async function main() {
  const studies = await seedCaseStudies()
  const pages = await seedMarketingPages()
  const chrome = await seedChrome()

  console.log(`Case studies created: ${studies}`)
  console.log(
    `Marketing pages written: ${pages.written.join(', ') || 'none'}` +
      (pages.skipped.length
        ? ` (left alone, already CMS-managed: ${pages.skipped.join(', ')})`
        : ''),
  )
  console.log(`Header/footer content: ${chrome ? 'seeded' : 'already set'}`)
  console.log(
    'Testimonials are deliberately not seeded — every quote on the site must be ' +
      'a real one, added through the admin.',
  )
}

main()
  .catch((error) => {
    console.error('Content seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
