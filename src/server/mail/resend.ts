import 'server-only'

import { Resend } from 'resend'

import { env } from '@/env'

/**
 * The Resend client.
 *
 * Created lazily. Instantiating at module scope would run on every cold start
 * of every route that transitively imports this file, including routes that
 * never send mail.
 *
 * **Not configured is a supported state.** Until a real API key is issued, the
 * environment carries a placeholder so that the rest of the application can be
 * built and deployed. Callers must check `isMailConfigured()` and degrade —
 * a lead is never lost because mail is not wired up yet.
 */
const PLACEHOLDER_PREFIXES = ['placeholder', 'changeme', 'todo', 'test_']

export function isMailConfigured(): boolean {
  const key = env.RESEND_API_KEY.trim()

  if (key.length === 0) return false
  if (PLACEHOLDER_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix)))
    return false

  // Every real Resend key is prefixed `re_`.
  return key.startsWith('re_')
}

let client: Resend | null = null

export function getResend(): Resend {
  client ??= new Resend(env.RESEND_API_KEY)
  return client
}

export const MAIL_FROM = `Kova Media Group <${env.MAIL_FROM_EMAIL}>`
export const NOTIFICATION_TO = env.CONTACT_NOTIFICATION_EMAIL
