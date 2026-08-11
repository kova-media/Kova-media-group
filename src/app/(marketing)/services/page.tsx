import type { Metadata } from 'next'
import { Mail, MessageSquare, ClipboardCheck, PenLine } from 'lucide-react'

import { services } from '@/lib/site-data'
import { Container, Eyebrow } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { Reveal } from '@/components/site/reveal'
import { FinalCta } from '@/features/marketing/sections'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Email marketing, SMS marketing, account audits, and copywriting for direct-to-consumer ecommerce brands.',
}

const ICONS = [Mail, MessageSquare, ClipboardCheck, PenLine]

/**
 * Four services, each given a full row rather than a card in a grid.
 *
 * The previous version listed ten capabilities as equal tiles, which read as a
 * feature list and made the offer look diffuse. Giving each of the four real
 * services its own band — number, icon, description, and what it includes —
 * communicates more with less, and leaves room for the copy to actually explain
 * the work.
 */
export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Four things, done properly."
        description="We do email and SMS marketing for ecommerce brands, and the audit and copywriting work that makes both perform. Not ten services — four, run in-house."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          <div className="flex flex-col">
            {services.map((service, index) => {
              const Icon = ICONS[index % ICONS.length] ?? Mail

              return (
                <Reveal key={service.slug}>
                  <article className="grid gap-8 border-b border-border py-14 last:border-0 md:grid-cols-[auto_1fr_20rem] md:gap-12 md:py-20">
                    <div className="flex items-start gap-5 md:flex-col md:gap-6">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>

                    <div>
                      <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground md:text-4xl">
                        {service.title}
                      </h2>
                      <p className="mt-4 max-w-xl text-lg leading-relaxed text-pretty text-foreground/85">
                        {service.summary}
                      </p>
                      <p className="mt-5 max-w-xl leading-relaxed text-pretty text-muted-foreground">
                        {service.description}
                      </p>
                    </div>

                    <div className="md:pt-2">
                      <h3 className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        What that includes
                      </h3>
                      <ul className="mt-5 flex flex-col gap-3">
                        {service.points.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80"
                          >
                            <span
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand"
                              aria-hidden
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>

          <Reveal className="mt-16">
            <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12">
              <Eyebrow>How we work</Eyebrow>
              <p className="mt-5 max-w-3xl text-xl leading-relaxed font-light text-balance text-foreground sm:text-2xl">
                No channel is run in isolation. Campaigns, flows, and SMS are planned
                together against a single revenue goal — so every message earns its
                place in the inbox.
              </p>
              <p className="mt-6 max-w-2xl leading-relaxed text-pretty text-muted-foreground">
                Platforms are part of the job, not the offer. We manage Klaviyo end to
                end as part of your programme — the account structure, the data, and the
                deliverability work behind it — because that is what makes the four
                services above actually perform.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <FinalCta />
    </>
  )
}
