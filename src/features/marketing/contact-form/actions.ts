'use server'

import { headers } from 'next/headers'

import { logger } from '@/lib/logger'
import {
  fail,
  formValue,
  ok,
  parseInput,
  unexpected,
  type ActionResult,
} from '@/server/actions/result'
import { checkRateLimit, getClientKey } from '@/server/auth/rate-limit'
import { sendContactNotification } from '@/server/mail/send'
import {
  createSubmission,
  markSubmissionNotified,
} from '@/server/submissions/mutations'

import { MIN_FILL_MS, contactFormSchema } from './schema'

/**
 * Contact form submission.
 *
 * Ordering is the whole design: **persist first, notify second.** A Resend
 * outage must never cost a lead, so the row is written and the notification is
 * attempted afterwards. If it fails, `notifiedAt` stays null and the admin
 * dashboard flags it.
 *
 * Three layers of spam defence, cheapest first — a honeypot, a timing check,
 * then a Postgres-backed per-IP rate limit. None of them are a CAPTCHA: this
 * form's realistic volume does not justify making every genuine prospect prove
 * they are human.
 */
export type ContactSubmitResult = { notified: boolean }

export async function submitContactForm(
  _previous: ActionResult<ContactSubmitResult> | null,
  formData: FormData,
): Promise<ActionResult<ContactSubmitResult>> {
  const parsed = parseInput(contactFormSchema, {
    name: formValue(formData, 'name'),
    email: formValue(formData, 'email'),
    company: formValue(formData, 'company'),
    websiteUrl: formValue(formData, 'websiteUrl'),
    monthlyRevenue: formValue(formData, 'monthlyRevenue'),
    message: formValue(formData, 'message'),
    source: formValue(formData, 'source'),
    companyWebsite: formValue(formData, 'companyWebsite'),
    renderedAt: formValue(formData, 'renderedAt') || undefined,
  })

  if (!parsed.ok) return parsed.result

  const input = parsed.data

  // A filled honeypot is a bot. It gets the success response a human would get:
  // telling a script it was detected only teaches the next version to adapt.
  if (input.companyWebsite) {
    logger.info('Contact form honeypot triggered')
    return ok({ notified: false })
  }

  if (input.renderedAt && Date.now() - input.renderedAt < MIN_FILL_MS) {
    logger.info('Contact form submitted implausibly fast')
    return ok({ notified: false })
  }

  try {
    const ipHash = await getClientKey()
    const { allowed } = await checkRateLimit('contact', ipHash)

    if (!allowed) {
      return fail(
        'That is a few messages in a short space of time. Please try again a little later, or email us directly.',
      )
    }

    const headerList = await headers()
    const userAgent = headerList.get('user-agent')

    const submission = await createSubmission({
      name: input.name,
      email: input.email,
      company: input.company || null,
      websiteUrl: input.websiteUrl || null,
      monthlyRevenue: input.monthlyRevenue || null,
      message: input.message,
      source: input.source || null,
      ipHash,
      userAgent: userAgent ? userAgent.slice(0, 500) : null,
    })

    const notified = await sendContactNotification({
      submissionId: submission.id,
      name: input.name,
      email: input.email,
      company: input.company || null,
      websiteUrl: input.websiteUrl || null,
      monthlyRevenue: input.monthlyRevenue || null,
      message: input.message,
      source: input.source || null,
    })

    if (notified) {
      // Best effort: the lead is already safe, so a failure to stamp the flag
      // must not turn a successful submission into an error for the visitor.
      await markSubmissionNotified(submission.id).catch((error) =>
        logger.error('Could not mark submission as notified', {
          submissionId: submission.id,
          error,
        }),
      )
    }

    return ok({ notified })
  } catch (error) {
    return unexpected('submitContactForm', error)
  }
}
