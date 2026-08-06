import 'server-only'

import { z } from 'zod'

import { logger } from '@/lib/logger'

/**
 * The single shape every Server Action returns.
 *
 * A discriminated union rather than `{ ok: boolean; error?: string }`, so that
 * the success branch cannot be read without narrowing (CODING_STANDARDS.md §2).
 *
 * Actions never throw to the client and never surface an internal message.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[] | undefined>
    }

export function ok(): ActionResult
export function ok<T>(data: T): ActionResult<T>
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data }
}

export function fail(
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ActionResult<never> {
  return fieldErrors ? { ok: false, message, fieldErrors } : { ok: false, message }
}

/**
 * Parses action input, returning a ready-to-return failure on a bad payload.
 * Keeps the "authorize, validate, write" sequence in every action short enough
 * to read at a glance.
 */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input)

  if (parsed.success) {
    return { ok: true, data: parsed.data }
  }

  return {
    ok: false,
    result: fail(
      'Please correct the highlighted fields.',
      z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>,
    ),
  }
}

/**
 * Logs an unexpected error with context and returns a generic message.
 * The user learns that something failed; they never learn our internals.
 */
export function unexpected(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>,
): ActionResult<never> {
  logger.error(`${scope} failed`, { error, ...context })
  return fail('Something went wrong. Please try again.')
}

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
