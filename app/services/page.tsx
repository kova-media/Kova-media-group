import type { Metadata } from 'next'
import { services } from '@/lib/site-data'
import { Container, Eyebrow, LiftCard } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { FinalCta } from '@/components/site/sections'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Email campaign management, automated flows, SMS marketing, Klaviyo and Sendlane management, design, copywriting, deliverability, and analytics for ecommerce brands.',
}

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything your owned channels need, run by one focused team."
        description="We do one thing: email and SMS marketing for ecommerce. Here is the full scope of what that includes, all handled in-house."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <RevealItem key={service.slug}>
                <LiftCard className="flex h-full flex-col p-7">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="mt-4 text-xl font-medium tracking-tight text-balance">
                    {service.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <ul className="mt-6 flex flex-col gap-2 border-t border-border pt-5">
                    {service.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2.5 text-sm text-foreground/80"
                      >
                        <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                </LiftCard>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-16">
            <div className="rounded-2xl border border-border bg-secondary/40 p-8 sm:p-12">
              <Eyebrow>How we work</Eyebrow>
              <p className="mt-5 max-w-3xl text-xl font-light leading-relaxed text-foreground sm:text-2xl text-balance">
                No channel is run in isolation. Campaigns, flows, and SMS are planned together
                against a single revenue goal — so every message earns its place in the inbox.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <FinalCta />
    </>
  )
}
