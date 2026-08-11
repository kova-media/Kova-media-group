import type { Metadata } from 'next'
import { Check } from 'lucide-react'

import { PageHeader } from '@/components/site/page-header'
import { Container } from '@/components/site/ui'
import { Reveal } from '@/components/site/reveal'
import { BookingEmbed } from '@/features/marketing/booking-embed'
import { getSiteChrome } from '@/server/content/site-chrome'

export const metadata: Metadata = {
  title: 'Book a Call',
  description:
    'Book a free 30-minute strategy call with Kova Media Group. We will audit your email and SMS setup and show you what your program is leaving on the table.',
}

/**
 * The booking page — the destination of the site's primary call to action.
 *
 * Deliberately sparse. Someone who has clicked "Book a strategy call" has
 * already decided; the job of this page is to get out of the way and show a
 * calendar. The three points below the header exist only to set expectations
 * for the call, not to sell again.
 */
const EXPECTATIONS = [
  'A free, no-pressure audit of your email & SMS setup',
  'A clear view of the revenue your program is leaving on the table',
  'Straight answers on whether we are the right fit — no hard sell',
]

export default async function BookPage() {
  const chrome = await getSiteChrome()

  return (
    <>
      <PageHeader
        eyebrow="Book a call"
        title="Thirty minutes. A real audit."
        description="Pick a time that suits you. We will look at your account before the call so the conversation starts with specifics, not introductions."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
            <Reveal>
              <ul className="flex flex-col gap-4">
                {EXPECTATIONS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/85">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-border pt-8">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Prefer to write first?{' '}
                  <a
                    href={`mailto:${chrome.contactEmail}`}
                    className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-foreground"
                  >
                    {chrome.contactEmail}
                  </a>
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <BookingEmbed url={chrome.bookingUrl} />
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  )
}
