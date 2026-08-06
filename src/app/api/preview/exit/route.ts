import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * POST, not GET: leaving preview changes state for future requests. It is also
 * reached from a <form>, which Next.js never prefetches — a <Link> would clear
 * the cookie as soon as the admin hovered it.
 */
export async function POST() {
  const draft = await draftMode()
  draft.disable()
  redirect('/')
}
