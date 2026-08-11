import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { caseStudies } from '@/lib/site-data'
import { Container, Eyebrow, CountUp } from '@/components/site/ui'
import { Reveal, RevealLines } from '@/components/site/reveal'
import { DashboardCard } from '@/components/site/mockups'
import { FinalCta } from '@/features/marketing/sections'

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const study = caseStudies.find((s) => s.slug === slug)
  if (!study) return { title: 'Case Study' }
  return {
    title: `${study.brand} Case Study`,
    description: study.summary,
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const study = caseStudies.find((s) => s.slug === slug)
  if (!study) notFound()

  // Wraps around to the first study after the last one. `study` was found
  // above, so the list is non-empty and the modulo always lands on a real
  // entry — the fallback exists to satisfy the compiler, not a real case.
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

          <h1 className="mt-6 max-w-4xl text-5xl font-medium leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
            <RevealLines lines={[study.brand]} />
          </h1>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
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
                    <p className="max-w-2xl text-lg leading-relaxed text-foreground/85 text-pretty">
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
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
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
