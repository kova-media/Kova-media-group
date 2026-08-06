import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'

import { env } from '@/env'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * The only `new PrismaClient()` in the codebase.
 *
 * Next.js hot-reloads modules in development, which would exhaust the
 * connection pool if a client were constructed on every reload — so the
 * instance is cached on `globalThis` outside production.
 *
 * Prisma 7 connects through a driver adapter rather than a URL in the schema.
 * The adapter gets the **pooled** connection string; Prisma Migrate uses the
 * direct one via prisma.config.ts. See docs/DATABASE.md §2.
 */
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
