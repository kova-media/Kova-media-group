import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getCaseStudyList } from '@/server/content/site-content'
import { Container } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { RevealGroup, RevealItem } from '@/components/site/reveal'
import { FinalCta } from '@/features/marketing/sections'

export const metadata: Metadata = {
  title: 'Case Studies',
  description:
    'Real results from ecommerce brands. See how Kova Media Group turned email and SMS into dependable revenue channels.',
}

export default async function CaseStudiesPage() {
  const caseStudies = await getCaseStudyList()

  return (
    <>
      <PageHeader
        eyebrow="Case Studies"
        title="Results that compound, brand by brand."
        description="A closer look at how we build email and SMS into channels our clients can count on."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          {/* Studies are rows on a ruled index, not stacked cards, and the
              figures are set in the site's own ink and teal rather than in a
              per-brand accent. Three studies previously introduced a blue, an
              orange and a green for no reason other than making the cards look
              different from one another. `study.accent` still exists in the
              content layer; it is simply not consumed here. */}
          <RevealGroup className="flex flex-col">
            {caseStudies.map((study, i) => (
              <RevealItem key={study.slug}>
                <Link
                  href={`/case-studies/${study.slug}`}
                  className="group grid gap-x-12 gap-y-8 border-t border-border py-12 transition-colors duration-300 last:border-b hover:border-foreground/25 sm:py-16 lg:grid-cols-[1fr_auto]"
                >
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 text-[0.8125rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                      <span className="font-mono tabular-nums">{i + 1}</span>
                      <span className="h-3 w-px bg-border-strong" aria-hidden />
                      <span>{study.category}</span>
                    </div>
                    <h2 className="mt-4 flex items-center gap-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                      {study.brand}
                      <ArrowUpRight
                        className="h-7 w-7 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand"
                        aria-hidden
                      />
                    </h2>
                    <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
                      {study.summary}
                    </p>
                  </div>

                  {/* The figures column appears only for studies that have
                      verified figures. An empty rule beside a study with
                      none would be an invitation to fill it. */}
                  {study.results.length > 0 && (
                    <div className="flex gap-x-12 gap-y-6 lg:justify-end lg:pt-1">
                      {study.results.slice(0, 2).map((result) => (
                        <div
                          key={result.label}
                          className="border-t-2 border-brand pt-4"
                        >
                          <div className="text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl">
                            {result.value}
                          </div>
                          <div className="mt-2 max-w-[10rem] text-[0.875rem] leading-snug text-muted-foreground">
                            {result.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <FinalCta />
    </>
  )
}
