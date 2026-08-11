'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { ok, parseInput, unexpected, type ActionResult } from '@/server/actions/result'
import { requireAdmin } from '@/server/auth/dal'
import {
  deleteSubmission,
  updateSubmissionNotes,
  updateSubmissionStatus,
} from '@/server/submissions/mutations'

/**
 * Enquiry triage.
 *
 * Nothing here touches the public cache: submissions never appear on the public
 * site, so there is no tag to invalidate — only the admin list to refresh.
 */
const statusSchema = z.enum(['NEW', 'READ', 'REPLIED', 'BOOKED', 'ARCHIVED', 'SPAM'])

export async function setSubmissionStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(z.object({ id: z.string().min(1), status: statusSchema }), {
    id,
    status,
  })
  if (!parsed.ok) return parsed.result

  try {
    await updateSubmissionStatus(parsed.data.id, parsed.data.status)
    revalidatePath('/admin/submissions')
    revalidatePath('/admin')
    return ok()
  } catch (error) {
    return unexpected('setSubmissionStatus', error)
  }
}

export async function setSubmissionNotes(
  id: string,
  notes: string,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(
    z.object({ id: z.string().min(1), notes: z.string().max(4000) }),
    { id, notes },
  )
  if (!parsed.ok) return parsed.result

  try {
    await updateSubmissionNotes(parsed.data.id, parsed.data.notes || null)
    revalidatePath('/admin/submissions')
    return ok()
  } catch (error) {
    return unexpected('setSubmissionNotes', error)
  }
}

/**
 * Hard delete. Submissions hold personal data and there is no soft delete by
 * design — a deletion request must actually remove the row (ADR-018).
 */
export async function removeSubmission(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    await deleteSubmission(id)
    revalidatePath('/admin/submissions')
    revalidatePath('/admin')
    return ok()
  } catch (error) {
    return unexpected('removeSubmission', error)
  }
}
