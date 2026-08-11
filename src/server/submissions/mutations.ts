import 'server-only'

import { prisma } from '@/db/prisma'
import type { SubmissionStatus } from '@/generated/prisma/enums'

/**
 * Contact submission writes.
 *
 * This table holds personal data, so it is deliberately thin: what the prospect
 * typed, how to reach them, and the minimum needed to spot abuse. No raw IP is
 * ever stored — only a salted hash (DATABASE.md §7).
 */

export type CreateSubmissionInput = {
  name: string
  email: string
  company: string | null
  websiteUrl: string | null
  monthlyRevenue: string | null
  message: string
  source: string | null
  ipHash: string | null
  userAgent: string | null
}

export async function createSubmission(
  input: CreateSubmissionInput,
): Promise<{ id: string }> {
  return prisma.contactSubmission.create({
    data: input,
    select: { id: true },
  })
}

/** Set once the Resend notification has actually been accepted. */
export async function markSubmissionNotified(id: string): Promise<void> {
  await prisma.contactSubmission.update({
    where: { id },
    data: { notifiedAt: new Date() },
  })
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<void> {
  await prisma.contactSubmission.update({ where: { id }, data: { status } })
}

export async function updateSubmissionNotes(
  id: string,
  adminNotes: string | null,
): Promise<void> {
  await prisma.contactSubmission.update({ where: { id }, data: { adminNotes } })
}

/**
 * Hard delete. There is no soft delete on this table by design: a deletion
 * request under GDPR must actually remove the row (ADR-018).
 */
export async function deleteSubmission(id: string): Promise<void> {
  await prisma.contactSubmission.delete({ where: { id } })
}

/**
 * Retention. Submissions older than 24 months are purged (ADR-018).
 * Returns the number removed, so the caller can log it.
 */
export async function pruneSubmissions(): Promise<number> {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 24)

  const { count } = await prisma.contactSubmission.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  return count
}
