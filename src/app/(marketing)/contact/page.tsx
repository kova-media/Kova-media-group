import type { Metadata } from 'next'
import { Mail, Clock } from 'lucide-react'
import { site } from '@/lib/site-data'
import { Container, Eyebrow } from '@/components/site/ui'
import { Reveal, RevealLines } from '@/components/site/reveal'
import { ContactForm } from '@/features/marketing/contact-form/contact-form'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Book a free call and account audit with Kova Media Group. Find out what your email and SMS program is leaving on the table.',
}

const points = [
  'A free, no-pressure audit of your email & SMS setup',
  'A clear view of the revenue your program is leaving on the table',
  'Straight answers on whether we’re the right fit — no hard sell',
]

export default function ContactPage() {
  return (
    <section className="pt-32 pb-24 sm:pt-40 sm:pb-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow>Contact</Eyebrow>
            <h1 className="mt-6 text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl">
              <RevealLines lines={['Let’s grow', 'your owned', 'channels.']} />
            </h1>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">
                Every engagement starts with a free call and account audit. Here&apos;s
                what you can expect.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <ul className="mt-8 flex flex-col gap-3">
                {points.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8">
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-3 text-sm text-foreground transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {site.email}
                </a>
                <span className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  We reply within one business day
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <ContactForm />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
