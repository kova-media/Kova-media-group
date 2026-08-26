import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'

/**
 * Prisma CLI configuration (migrations, generate, seed).
 *
 * Next.js loads `.env.local` automatically; the Prisma CLI does not, and plain
 * `dotenv/config` only reads `.env`. Both are loaded here, `.env.local` first,
 * so the CLI sees the same values the app does.
 */
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const url = process.env['DIRECT_URL']

/**
 * Commands that actually talk to a database.
 *
 * `generate` does not — it reads the schema and writes a client. It runs on
 * every `npm ci` through `postinstall`, including on a CI job that holds no
 * secrets, so throwing here for a missing URL failed the install before a
 * single check could run. The error is worth keeping; it just belongs on the
 * commands that need the connection.
 */
const NEEDS_DATABASE = new Set(['migrate', 'db', 'studio', 'debug'])

if (!url && NEEDS_DATABASE.has(process.argv[2] ?? '')) {
  throw new Error(
    'DIRECT_URL is not set. Prisma Migrate needs the direct (non-pooled) connection.\n' +
      'See .env.example.',
  )
}

/**
 * The CLI uses the **direct** connection: Prisma Migrate issues statements a
 * transaction pooler cannot proxy. The application runtime uses the pooled
 * connection via the driver adapter in src/db/prisma.ts. See docs/DATABASE.md §2.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  ...(url ? { datasource: { url } } : {}),
})
