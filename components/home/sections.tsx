'use client'

import Link from 'next/link'
import {
  Mail,
  Workflow,
  MessageSquare,
  PenLine,
  LineChart,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'
import { services, caseStudies, process, resources } from '@/lib/site-data'
import { Container, Eyebrow, ButtonLink, LiftCard } from '@/components/site/ui'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { FlowDiagram, DashboardCard } from '@/components/site/mockups'

const serviceIcons = [Mail, Workflow, MessageSquare, LineChart, PenLine, ArrowUpRight]

/* --------------------------------------------------------------- Services preview */

export function ServicesPreview() {
  const featured = services.slice(0, 6)
  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-2xl">
            <Eyebrow>What we do</Eyebrow>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Two channels. Done exceptionally well.
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              We are not a full-service agency. We do email and SMS — the highest-ROI channels in
              ecommerce — and we do them better than generalists ever could.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink href="/services" variant="secondary" withArrow>
              All services
            </ButtonLink>
          </Reveal>
        </div>

        <RevealGroup className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((service, i) => {
            const Icon = serviceIcons[i % serviceIcons.length]
            return (
              <RevealItem key={service.slug}>
                <Link
                  href="/services"
                  className="group flex h-full flex-col bg-card p-7 transition-colors duration-300 hover:bg-background"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium text-foreground">{service.title}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {service.summary}
                  </p>
                </Link>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------- Featured case studies */

export function FeaturedCaseStudies() {
  const featured = caseStudies.slice(0, 3)
  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>Selected work</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            See our work.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Real programs for real brands. Here is a look at how focused email and SMS work
            translates into revenue.
          </p>
        </Reveal>

        <div className="mt-16 space-y-6">
          {featured.map((cs, i) => (
            <Reveal key={cs.slug} delay={i * 0.05}>
              <LiftCard className="group overflow-hidden rounded-3xl border border-border bg-surface">
                <Link
                  href={`/case-studies/${cs.slug}`}
                  className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-10"
                >
                  <div>
                    <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {cs.category}
                    </span>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                      {cs.brand}
                    </h3>
                    <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
                      {cs.summary}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-8">
                      {cs.results.slice(0, 3).map((r) => (
                        <div key={r.label}>
                          <p className="text-2xl font-semibold tracking-tight text-foreground">
                            {r.value}
                          </p>
                          <p className="mt-1 max-w-[9rem] text-xs leading-snug text-muted-foreground">
                            {r.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      Read case study
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                  <div
                    className="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl md:h-72"
                    style={{ backgroundColor: 'color-mix(in oklch, ' + cs.accent + ' 8%, white)' }}
                  >
                    <div
                      className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
                      style={{ backgroundColor: cs.accent }}
                      aria-hidden
                    />
                    <span
                      className="text-4xl font-semibold tracking-tight md:text-5xl"
                      style={{ color: cs.accent }}
                    >
                      {cs.brand}
                    </span>
                  </div>
                </Link>
              </LiftCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------ Process + automation */

export function ProcessPreview() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <Eyebrow>How we work</Eyebrow>
              <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                A clear, four-step engagement.
              </h2>
              <p className="mt-4 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
                No mystery, no fluff. You always know what we are working on and why.
              </p>
            </Reveal>

            <div className="mt-12">
              {process.map((p, i) => (
                <Reveal key={p.step} delay={i * 0.05}>
                  <div className="relative flex gap-6 pb-10 last:pb-0">
                    {i < process.length - 1 && (
                      <span
                        className="absolute left-[19px] top-11 h-full w-px bg-border-strong"
                        aria-hidden
                      />
                    )}
                    <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-foreground">
                      {p.step}
                    </span>
                    <div className="pt-1">
                      <h3 className="text-lg font-medium text-foreground">{p.title}</h3>
                      <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 lg:sticky lg:top-28 lg:self-start">
            <FlowDiagram />
            <DashboardCard className="hidden lg:block" />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------------- About preview */

export function AboutPreview() {
  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="justify-center">Why specialists</Eyebrow>
            <p className="mt-8 text-balance text-2xl font-medium leading-[1.4] tracking-tight text-foreground md:text-3xl md:leading-[1.4]">
              Full-service agencies spread themselves thin across a dozen channels. We chose the
              opposite. By focusing only on email and SMS, we go deeper — better strategy, sharper
              copy, cleaner data, and results generalists can&apos;t match.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/about" variant="secondary" withArrow>
                About Kova
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------- Resources preview */

export function ResourcesPreview() {
  const featured = resources.slice(0, 3)
  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-2xl">
            <Eyebrow>Resources</Eyebrow>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Ideas worth your inbox.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink href="/resources" variant="secondary" withArrow>
              All resources
            </ButtonLink>
          </Reveal>
        </div>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {featured.map((r) => (
            <RevealItem key={r.slug}>
              <LiftCard className="h-full">
                <Link
                  href="/resources"
                  className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                      {r.category}
                    </span>
                    <span className="text-muted-foreground">{r.readTime}</span>
                  </div>
                  <h3 className="mt-5 text-pretty text-lg font-medium leading-snug text-foreground">
                    {r.title}
                  </h3>
                  <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {r.excerpt}
                  </p>
                </Link>
              </LiftCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}
