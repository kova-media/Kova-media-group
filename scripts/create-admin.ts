import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'

import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { PrismaClient } from '../src/generated/prisma/client'

/**
 * Creates the administrator: a Supabase Auth user (credentials) plus the
 * AdminUser row that actually grants authorization (ADR-004).
 *
 * Both are required. A Supabase user without an active AdminUser row can
 * authenticate but is not an administrator — the DAL rejects it.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name"
 *
 * A strong password is generated and printed ONCE. Change it after first login.
 * Re-running for an existing email repairs the AdminUser row rather than
 * failing, so a half-finished first run is recoverable.
 */
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is not set. See .env.example.`)
  return value
}

/** Avoids ambiguous glyphs so the password can be read off a terminal reliably. */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_'
  const bytes = randomBytes(24)
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('')
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
    },
  })

  const email = values.email?.trim().toLowerCase()
  const name = values.name?.trim() || 'Administrator'

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(
      'Usage: npm run admin:create -- --email you@example.com --name "Your Name"',
    )
  }

  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireEnv('DIRECT_URL') }),
  })

  try {
    const password = generatePassword()

    // email_confirm skips the verification round trip: this account is created
    // deliberately by an operator, not self-registered.
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    let supabaseId: string
    let issuedPassword: string | null = password

    if (created.error) {
      const alreadyExists =
        created.error.status === 422 ||
        /already (been )?registered|already exists/i.test(created.error.message)

      if (!alreadyExists) throw created.error

      // Recover from a partial previous run: find the existing auth user and
      // just ensure the AdminUser row exists. Their password is left alone.
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
      if (error) throw error

      const existing = data.users.find((user) => user.email?.toLowerCase() === email)
      if (!existing) {
        throw new Error(
          `Supabase reports ${email} exists but it was not found in the first 200 users.`,
        )
      }

      supabaseId = existing.id
      issuedPassword = null
      console.log('Supabase user already existed — password left unchanged.')
    } else {
      supabaseId = created.data.user.id
    }

    const admin = await prisma.adminUser.upsert({
      where: { supabaseId },
      update: { email, name, isActive: true },
      create: { supabaseId, email, name, isActive: true },
    })

    console.log('\nAdministrator ready.')
    console.log('  email:   ', admin.email)
    console.log('  name:    ', admin.name)
    console.log('  adminId: ', admin.id)

    if (issuedPassword) {
      console.log('\n  password:', issuedPassword)
      console.log('\n  ^ Shown once. Save it now, then change it after signing in.')
    }

    console.log('\nSign in at /admin/login')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('\nCould not create the administrator:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
