import { config as loadEnv } from 'dotenv'

// Vitest does not read .env.local the way Next.js does. Integration tests that
// touch the real database need the same values the app uses.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

/**
 * Placeholders for a hermetic run.
 *
 * `src/env.ts` validates the whole environment at import and throws when
 * anything is missing. Any test whose import graph reaches it — the publish
 * integration suite reaches it through `@/db/prisma` — therefore fails at
 * *collection* time on a machine with no secrets, before `describe.skipIf` gets
 * a chance to skip it. That is what turned `npm test` red in CI while passing
 * on every developer's laptop.
 *
 * These fill only what is absent, so a real `.env.local` always wins, and they
 * are obviously fake so nothing can quietly depend on one. The integration
 * suite still requires `INTEGRATION_DB` and a real connection string before it
 * touches a database.
 */
const PLACEHOLDERS: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  DIRECT_URL: 'postgresql://test:test@localhost:5432/test',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  RESEND_API_KEY: 'test-resend-key',
  CONTACT_NOTIFICATION_EMAIL: 'test@example.com',
  MAIL_FROM_EMAIL: 'test@example.com',
  PREVIEW_SECRET: 'test-placeholder-secret-at-least-32-characters',
  IP_HASH_SALT: 'test-placeholder-secret-at-least-32-characters',
  REVALIDATE_SECRET: 'test-placeholder-secret-at-least-32-characters',
  NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
}

for (const [key, value] of Object.entries(PLACEHOLDERS)) {
  process.env[key] ??= value
}
