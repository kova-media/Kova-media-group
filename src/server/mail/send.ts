import 'server-only'

import { env } from '@/env'
import { logger } from '@/lib/logger'

import {
  contactNotificationHtml,
  contactNotificationSubject,
  contactNotificationText,
  type ContactNotificationInput,
} from './templates'
import { MAIL_FROM, NOTIFICATION_TO, getResend, isMailConfigured } from './resend'

/**
 * Typed send helpers.
 *
 * **Sending never throws.** Every helper returns a boolean, because the caller
 * has already persisted the thing the email is about. A Resend outage must cost
 * a notification, never a lead — the submission is stored first, `notifiedAt`
 * stays null, and the admin dashboard surfaces the gap so it can be chased by
 * hand (ROADMAP Phase 4 exit criteria).
 */
export async function sendContactNotification(
  input: Omit<ContactNotificationInput, 'adminUrl'> & { submissionId: string },
): Promise<boolean> {
  const payload: ContactNotificationInput = {
    ...input,
    adminUrl: `${env.NEXT_PUBLIC_SITE_URL}/admin/submissions/${input.submissionId}`,
  }

  if (!isMailConfigured()) {
    logger.warn('Resend is not configured; contact notification not sent', {
      submissionId: input.submissionId,
    })
    return false
  }

  try {
    const { error } = await getResend().emails.send({
      from: MAIL_FROM,
      to: NOTIFICATION_TO,
      // Replying to the notification should reach the prospect, not us.
      replyTo: input.email,
      subject: contactNotificationSubject(payload),
      text: contactNotificationText(payload),
      html: contactNotificationHtml(payload),
    })

    if (error) {
      logger.error('Resend rejected the contact notification', {
        submissionId: input.submissionId,
        error: error.message,
      })
      return false
    }

    return true
  } catch (error) {
    logger.error('Contact notification failed to send', {
      submissionId: input.submissionId,
      error,
    })
    return false
  }
}
