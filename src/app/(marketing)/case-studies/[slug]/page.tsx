import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  getCaseStudyDetail,
  getCaseStudyList,
  getCaseStudySlugs,
} from '@/server/content/site-content'
import { Container, Eyebrow, CountUp } from '@/components/site/ui'
import { Reveal, RevealLines } from '@/components/site/reveal'
import { DashboardCard } from '@/components/site/mockups'
import { FinalCta } from '@/features/marketing/sections'

/**
 * Prerenders every published case study at build time (ADR-017). Reads the
 * same source as the page, so a newly published study is picked up on the
 * next build and served on demand before that.
 */
export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs()
  // Cache Components requires at least one result. The bundled fallback means
  // this is never empty today, but relying on that is a trap for whoever
  // removes it later.
  return (slugs.length > 0 ? slugs : ['__no-published-content__']).map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const study = await getCaseStudyDetail(slug)

  // `notFound()` here rather than only in the page body. Metadata is resolved
  // before the response starts streaming, so this is what makes a missing case
  // study return a real 404 on the *first* request — the one a crawler makes.
  // Left to the body alone, the shell has already flushed a 200 and the result
  // is a soft 404 until the response happens to be cached.
  if (!study) notFound()

  return {
    title: `${study.brand} Case Study`,
    description: study.summary,
  }
}

/**
 * Blocking rather than instant-shell (ADR-017 revisited).
 *
 * Every published slug is prerendered by `generateStaticParams`, so real pages
 * are served as static HTML and lose nothing here. The only URLs that reach a
 * runtime render are ones that do not exist — and with an instant shell those
 * flush a 200 before `notFound()` is ever reached, producing a soft 404 that
 * search engines treat as a thin page. Blocking lets the 404 status be set
 * correctly, which matters more than an instant shell on a URL with no content.
 */
export const instant = false

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [study, caseStudies] = await Promise.all([
    getCaseStudyDetail(slug),
    getCaseStudyList(),
  ])

  if (!study) notFound()

  // Wraps around to the first study after the last one. `study` exists, so the
  // list is non-empty and the modulo always lands on a real entry — the
  // fallback exists to satisfy the compiler, not a real case.
  const index = caseStudies.findIndex((s) => s.slug === slug)
  const next = caseStudies[(index + 1) % caseStudies.length] ?? study

  const blocks = [
    { label: 'Background', body: study.background },
    { label: 'The challenge', body: study.challenge },
    { label: 'Design', body: study.design },
    { label: 'Automation', body: study.automation },
    { label: 'SMS', body: study.sms },
  ]

  return (
    <>
      <section className="border-b border-border pt-32 sm:pt-40">
        <Container>
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All case studies
          </Link>

          <div className="mt-8 flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: study.accent }}
              aria-hidden
            />
            {study.category}
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl md:text-7xl">
            <RevealLines lines={[study.brand]} />
          </h1>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
              {study.summary}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            {study.results.map((result) => (
              <div key={result.label} className="bg-card p-8">
                <div
                  className="text-4xl font-medium tracking-tight sm:text-5xl"
                  style={{ color: study.accent }}
                >
                  <CountUp value={result.value} />
                </div>
                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {result.label}
                </div>
              </div>
            ))}
          </div>
          <div className="pb-16" />
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-20">
            <div className="flex flex-col gap-14">
              {blocks.map((block) => (
                <Reveal key={block.label}>
                  <div className="grid gap-4 sm:grid-cols-[8rem_1fr] sm:gap-8">
                    <Eyebrow>{block.label}</Eyebrow>
                    <p className="max-w-2xl text-lg leading-relaxed text-pretty text-foreground/85">
                      {block.body}
                    </p>
                  </div>
                </Reveal>
              ))}

              <Reveal>
                <div className="grid gap-4 sm:grid-cols-[8rem_1fr] sm:gap-8">
                  <Eyebrow>Strategy</Eyebrow>
                  <ul className="flex flex-col gap-3">
                    {study.strategy.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-lg leading-relaxed text-foreground/85"
                      >
                        <span
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: study.accent }}
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <DashboardCard />
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16">
        <Container>
          <Link
            href={`/case-studies/${next.slug}`}
            className="group flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                Next case study
              </span>
              <div className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                {next.brand}
              </div>
            </div>
            <ArrowRight className="h-7 w-7 text-muted-foreground transition-transform duration-300 group-hover:translate-x-2 group-hover:text-primary" />
          </Link>
        </Container>
      </section>

      <FinalCta />
    </>
  )
}
