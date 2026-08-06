import { config as loadEnv } from 'dotenv'

// Vitest does not read .env.local the way Next.js does. Integration tests that
// touch the real database need the same values the app uses.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })
