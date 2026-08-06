import 'server-only'

import { z } from 'zod'

/**
 * Validated environment. Imported for its side effect at server startup, so a
 * missing or malformed variable fails the build rather than the first request.
 *
 * Only `NEXT_PUBLIC_*` values ever reach the browser, and each one is justified
 * below. Everything else in this file is server-only.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /// Pooled connection (Supavisor transaction mode). Used by PrismaClient at runtime.
  DATABASE_URL: z.string().url(),
  /// Direct connection. Used by Prisma Migrate via prisma.config.ts.
  DIRECT_URL: z.string().url(),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  /// Where contact form notifications are delivered.
  CONTACT_NOTIFICATION_EMAIL: z.string().email(),
  /// Verified Resend sender.
  MAIL_FROM_EMAIL: z.string().email(),

  /// Shared secret for the Draft Mode entry route.
  PREVIEW_SECRET: z.string().min(32),
  /// Salt for hashing IPs before storage. Never a constant — an unsalted hash
  /// of an IPv4 address is reversible by enumeration.
  IP_HASH_SALT: z.string().min(32),
  /// Guards POST /api/revalidate.
  REVALIDATE_SECRET: z.string().min(32),
})

const clientSchema = z.object({
  /// Needed by the browser Supabase client for the admin auth session.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  /// Anon key. Safe to expose: every application table denies the anon role (ADR-006).
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  /// Canonical origin, used for metadata, sitemap and Server Action origin checks.
  NEXT_PUBLIC_SITE_URL: z.string().url(),
})

function parseEnv() {
  const parsed = serverSchema.merge(clientSchema).safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(
      `Invalid environment variables:\n${issues}\n\n` +
        'See .env.example for the expected shape.',
    )
  }

  return parsed.data
}

export const env = parseEnv()

export type Env = typeof env
