import type { Metadata } from 'next'
import { Mail, MessageSquare } from 'lucide-react'

import { services } from '@/lib/site-data'
import { Container } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { Reveal } from '@/components/site/reveal'
import { FinalCta } from '@/features/marketing/sections'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Email marketing and SMS marketing for direct-to-consumer ecommerce brands. Two channels, run end to end.',
}

const ICONS = [Mail, MessageSquare]

/**
 * Two services, each given a full row rather than a card in a grid.
 *
 * An earlier version listed ten capabilities as equal tiles, which read as a
 * feature list and made the offer look diffuse. Giving each of the two real
 * services its own band — number, icon, description, and what it includes —
 * communicates more with less, and leaves room for the copy to actually explain
 * the work.
 */
export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Two things, done properly."
        description="We do email marketing and SMS marketing for ecommerce brands. Not ten services — two, run end to end and in-house."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          <div className="flex flex-col">
            {services.map((service, index) => {
              const Icon = ICONS[index % ICONS.length] ?? Mail

              return (
                <Reveal key={service.slug}>
                  <article className="grid gap-8 border-b border-border py-14 last:border-0 md:grid-cols-[3.5rem_1fr_20rem] md:gap-12 md:py-20">
                    {/* The numeral is plain and the icon is unboxed. A tinted
                        rounded chip behind a 20px glyph is depth for its own
                        sake — the icon reads perfectly well on the page. */}
                    <div className="flex items-center gap-5 md:flex-col md:items-start md:gap-7">
                      <span className="font-mono text-sm text-muted-foreground tabular-nums">
                        {index + 1}
                      </span>
                      <Icon className="h-6 w-6 shrink-0 text-brand" aria-hidden />
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

                    <div className="md:pt-3">
                      <h3 className="text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase">
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

          {/* The closing statement was boxed in a tinted rounded panel, which
              made the most important paragraph on the page look like an aside.
              It is now set on the page under a teal rule, at a size that says
              it matters. */}
          <Reveal className="mt-20">
            <div className="grid gap-x-12 gap-y-8 border-t-2 border-brand pt-10 md:grid-cols-[3.5rem_1fr]">
              <span className="text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase md:pt-2">
                How
              </span>
              <div>
                <p className="max-w-3xl text-2xl leading-[1.4] font-medium tracking-tight text-balance text-foreground sm:text-3xl">
                  No channel is run in isolation. Campaigns, flows, and SMS are planned
                  together against a single revenue goal — so every message earns its
                  place in the inbox.
                </p>
                <p className="mt-7 max-w-2xl leading-relaxed text-pretty text-muted-foreground">
                  Platforms are part of the job, not the offer. We work in Klaviyo,
                  Privy, Postscript, and many more, and we manage whichever one you are
                  on end to end — the account structure, the data, and the
                  deliverability work behind it — because that is what makes both
                  channels actually perform.
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <FinalCta />
    </>
  )
}
