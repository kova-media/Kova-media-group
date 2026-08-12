import { config as loadEnv } from 'dotenv'

import { PrismaPg } from '@prisma/adapter-pg'

// The Prisma CLI does not read .env.local the way Next.js does.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { PrismaClient } from '../src/generated/prisma/client'
import { caseStudies } from '../src/lib/site-data'

/**
 * Forces the published case studies back to the bundled content.
 *
 * `prisma/seed-content.ts` deliberately never touches a row that already
 * exists, because its job is to populate an empty database without trampling
 * an edit made in the admin. That is the right default and stays the default —
 * but it means a correction to `site-data.ts` cannot reach a database that was
 * already seeded, and the public site reads the database. The three studies
 * seeded on 11 August carried v0-generated figures and industry labels; fixing
 * the file alone would have left the live pages exactly as they were.
 *
 * This is the deliberate override, kept separate and run by hand:
 *
 *     npm run db:sync:case-studies
 *
 * It overwrites both draft and published content for the slugs in
 * `site-data.ts` and leaves every other row alone. Anything edited through the
 * admin for those three studies is replaced, so re-run it only when the
 * bundled content is the source of truth.
 */
const connectionString = process.env['DIRECT_URL']

if (!connectionString) {
  throw new Error('DIRECT_URL is required to sync case studies.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const SYNC_AUTHOR = 'script:sync-case-studies'

async function main() {
  for (const [index, study] of caseStudies.entries()) {
    const existing = await prisma.caseStudy.findUnique({
      where: { slug: study.slug },
      select: { id: true, publishedAt: true },
    })

    if (!existing) {
      console.log(`· ${study.slug} — not in the database, skipped`)
      continue
    }

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

    await prisma.caseStudy.update({
      where: { id: existing.id },
      data: {
        clientName: study.brand,
        headline: study.summary.split('.')[0] ?? study.brand,
        summary: study.summary,
        industry: study.category,
        position: index,
        draftContent: content,
        // Only republish what was already live. A study left unpublished in
        // the admin stays unpublished — this corrects content, it does not
        // decide what is public.
        ...(existing.publishedAt
          ? {
              publishedContent: content,
              publishedAt: new Date(),
              publishedBy: SYNC_AUTHOR,
            }
          : {}),
        seoTitle: `${study.brand} case study`,
        seoDescription: study.summary,
      },
    })

    // Publish history is append-only, so the previous content stays recoverable.
    await prisma.contentRevision.create({
      data: {
        entityType: 'caseStudy',
        entityId: existing.id,
        content,
        action: existing.publishedAt ? 'published' : 'saved',
        createdBy: SYNC_AUTHOR,
      },
    })

    console.log(
      `✓ ${study.slug} — synced${existing.publishedAt ? ' and republished' : ''}`,
    )
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
