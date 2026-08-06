import 'server-only'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'

import { prisma } from '@/db/prisma'
import { env } from '@/env'

/**
 * Postgres-backed windowed rate limiting (ADR-019). No external KV service:
 * realistic volume here is tens of events per month against an indexed table.
 */

export type RateLimitBucket = 'login' | 'contact'

const LIMITS: Record<RateLimitBucket, { max: number; windowMs: number }> = {
  login: { max: 8, windowMs: 15 * 60 * 1000 },
  contact: { max: 5, windowMs: 60 * 60 * 1000 },
}

/**
 * Salted hash of the client IP.
 *
 * The salt is a secret, never a constant: an unsalted hash of an IPv4 address
 * is reversible by enumerating all four billion of them, which would defeat the
 * entire point of not storing the address.
 */
export async function getClientKey(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  const ip =
    forwarded?.split(',')[0]?.trim() ?? headerList.get('x-real-ip') ?? 'unknown'

  return createHash('sha256').update(`${env.IP_HASH_SALT}:${ip}`).digest('hex')
}

/**
 * Records an attempt and reports whether the caller is over the limit.
 * Fails **open** on a database error: a rate limiter that takes the contact
 * form down with it costs more than the abuse it prevents.
 */
export async function checkRateLimit(
  bucket: RateLimitBucket,
  key: string,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const limit = LIMITS[bucket]
  const windowStart = new Date(Date.now() - limit.windowMs)

  try {
    const recent = await prisma.rateLimitEntry.count({
      where: { bucket, key, createdAt: { gte: windowStart } },
    })

    if (recent >= limit.max) {
      return { allowed: false, retryAfterMs: limit.windowMs }
    }

    await prisma.rateLimitEntry.create({ data: { bucket, key } })

    return { allowed: true, retryAfterMs: 0 }
  } catch {
    return { allowed: true, retryAfterMs: 0 }
  }
}

/** Removes entries older than the longest window. Called by the retention job. */
export async function pruneRateLimitEntries(): Promise<number> {
  const oldest = Math.max(...Object.values(LIMITS).map((l) => l.windowMs))
  const { count } = await prisma.rateLimitEntry.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - oldest) } },
  })

  return count
}
