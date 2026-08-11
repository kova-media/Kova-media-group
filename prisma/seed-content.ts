import { config as loadEnv } from 'dotenv'

import { PrismaPg } from '@prisma/adapter-pg'

// The Prisma CLI does not read .env.local the way Next.js does.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { PrismaClient } from '../src/generated/prisma/client'
import { caseStudies, faqs, resources, testimonials } from '../src/lib/site-data'

/**
 * Moves the real Kova content out of `site-data.ts` and into the CMS.
 *
 * `site-data.ts` stays in the repository as the fallback the public site uses
 * when a table is empty — a fresh clone or preview environment still renders a
 * complete site. This script promotes that same content into the database so
 * the owner can edit it without touching code.
 *
 * Idempotent: every write is an upsert on a stable key, and existing rows are
 * left alone. Running it twice changes nothing, and it will never overwrite an
 * edit made through the admin.
 */
const connectionString = process.env['DIRECT_URL']

if (!connectionString) {
  throw new Error('DIRECT_URL is required to seed.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const SEED_AUTHOR = 'seed:content'

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
        accent: study.accent,
      },
    }

    // Seeded live: these are the real, already-public case studies, and a site
    // that ships with an empty work section is worse than one that ships with
    // the content it already has. Editing and republishing works normally.
    const created_ = await prisma.caseStudy.create({
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
        entityId: created_.id,
        content,
        action: 'published',
        createdBy: SEED_AUTHOR,
      },
    })

    created += 1
  }

  return created
}

async function seedTestimonials() {
  let created = 0

  for (const [index, quote] of testimonials.entries()) {
    // No natural key on the source data, so the quote itself is the identity.
    const existing = await prisma.testimonial.findFirst({
      where: { quote: quote.quote },
      select: { id: true },
    })

    if (existing) continue

    await prisma.testimonial.create({
      data: {
        quote: quote.quote,
        // The source attributes these by role and brand type rather than by
        // name. That is preserved exactly — inventing a person here would be
        // fabricating a testimonial.
        authorName: quote.name,
        authorRole: null,
        companyName: quote.role,
        isPublished: true,
        position: index,
      },
    })

    created += 1
  }

  return created
}

/**
 * The FAQ lives on a CMS page so it can be edited with the section editor that
 * already exists, rather than needing a bespoke table.
 */
async function seedFaqPage() {
  const existing = await prisma.page.findUnique({
    where: { slug: 'faq' },
    select: { id: true },
  })

  if (existing) return 0

  const content = {
    sections: [
      {
        id: 'faq-main',
        type: 'FAQ',
        isEnabled: true,
        data: {
          heading: 'Questions, answered.',
          items: faqs.map((item) => ({
            question: item.q,
            answer: [
              {
                type: 'paragraph' as const,
                children: [{ type: 'text' as const, text: item.a }],
              },
            ],
          })),
        },
      },
    ],
  }

  await prisma.page.create({
    data: {
      slug: 'faq',
      title: 'FAQ',
      isSystem: true,
      seoTitle: 'Frequently asked questions',
      seoDescription:
        'Common questions about working with Kova Media Group on email and SMS marketing.',
      draftContent: content,
      publishedContent: content,
      publishedAt: new Date(),
      publishedBy: SEED_AUTHOR,
    },
  })

  return 1
}

/**
 * Articles are seeded as **drafts**, not published.
 *
 * The bundled resource entries are titles and excerpts with no body — they were
 * written as index cards, not articles. Publishing them would put live pages on
 * the site with nothing on them. Seeded as drafts, they appear in the admin
 * ready to be written, and the public index keeps showing the bundled cards
 * until a real article is published.
 */
async function seedResources() {
  let created = 0

  for (const [index, article] of resources.entries()) {
    const existing = await prisma.resource.findUnique({
      where: { slug: article.slug },
      select: { id: true },
    })

    if (existing) continue

    await prisma.resource.create({
      data: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        readTime: article.readTime,
        isFeatured: index === 0,
        position: index,
        draftContent: { sections: [] },
        seoTitle: article.title,
        seoDescription: article.excerpt,
      },
    })

    created += 1
  }

  return created
}

async function main() {
  const [studies, quotes, faqPage, articles] = [
    await seedCaseStudies(),
    await seedTestimonials(),
    await seedFaqPage(),
    await seedResources(),
  ]

  console.log(
    `Content seed complete: ${studies} case studies, ${quotes} testimonials, ` +
      `${faqPage} FAQ page, ${articles} draft articles.`,
  )
  console.log('(Existing rows are never modified — re-running is a no-op.)')
}

main()
  .catch((error) => {
    console.error('Content seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
