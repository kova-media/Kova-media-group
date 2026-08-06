import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Prisma CLI configuration (migrations, generate, seed).
 *
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
  datasource: {
    url: process.env['DIRECT_URL'],
  },
})
