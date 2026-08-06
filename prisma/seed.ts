import { config as loadEnv } from 'dotenv'

import { PrismaPg } from '@prisma/adapter-pg'

// The Prisma CLI does not read .env.local the way Next.js does.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { PrismaClient } from '../src/generated/prisma/client'

/**
 * Idempotent seed. Produces a working site from an empty database, so that a
 * fresh clone or a disposable preview environment is useful within minutes.
 *
 * Uses the DIRECT connection: this is a one-shot script, not serverless traffic.
 * Every write is an upsert on a stable key, so running it twice is a no-op.
 *
 * The admin user is NOT created here — it is linked to a Supabase Auth user,
 * which requires the service role key. Run `npm run db:seed:admin` for that.
 */
const connectionString = process.env['DIRECT_URL']

if (!connectionString) {
  throw new Error('DIRECT_URL is required to seed.')
}

if (process.env['NODE_ENV'] === 'production') {
  throw new Error('Refusing to seed a production database.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteName: 'Kova Media Group',
      defaultSeoTitle: 'Kova Media Group — Email & SMS marketing for DTC brands',
      defaultSeoDescription:
        'Email and SMS marketing for DTC brands doing $50k+ a month. Kova becomes an extension of your team.',
      contactEmail: 'hello@kovamediagroup.com',
      navigation: [
        { label: 'Work', href: '/work' },
        { label: 'Contact', href: '/contact' },
      ],
      footer: {
        tagline: 'Email and SMS marketing, done as part of your team.',
      },
      socialLinks: [],
    },
  })
}

/**
 * System pages exist from the first boot so the admin never sees an empty shell.
 * They are seeded as drafts: publishing is a deliberate act, even here.
 */
async function seedPages() {
  const pages = [
    {
      slug: 'home',
      title: 'Homepage',
      seoTitle: 'Kova Media Group — Email & SMS marketing for DTC brands',
    },
    {
      slug: 'contact',
      title: 'Contact',
      seoTitle: 'Book a strategy call',
    },
    {
      slug: 'privacy',
      title: 'Privacy policy',
      seoTitle: 'Privacy policy',
    },
  ]

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      // Never clobber real content on a re-run.
      update: {},
      create: {
        slug: page.slug,
        title: page.title,
        isSystem: page.slug !== 'privacy',
        seoTitle: page.seoTitle,
        draftContent: { sections: [] },
      },
    })
  }
}

async function main() {
  await seedSettings()
  await seedPages()

  const [pages, settings] = await Promise.all([
    prisma.page.count(),
    prisma.siteSettings.count(),
  ])

  console.log(`Seed complete: ${pages} pages, ${settings} settings row.`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
