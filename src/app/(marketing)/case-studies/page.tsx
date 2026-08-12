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
          <RevealGroup className="flex flex-col gap-5">
            {caseStudies.map((study, i) => (
              <RevealItem key={study.slug}>
                <Link
                  href={`/case-studies/${study.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/20"
                >
                  <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        <span className="h-3 w-px bg-border" aria-hidden />
                        <span>{study.category}</span>
                      </div>
                      <h2 className="mt-5 flex items-center gap-3 text-3xl font-medium tracking-tight sm:text-4xl">
                        {study.brand}
                        <ArrowUpRight className="h-6 w-6 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" />
                      </h2>
                      <p className="mt-4 leading-relaxed text-muted-foreground">
                        {study.summary}
                      </p>
                    </div>

                    {/* The figures column appears only for studies that have
                        verified figures. An empty rule beside a study with
                        none would be an invitation to fill it. */}
                    {study.results.length > 0 && (
                      <div className="flex gap-8 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                        {study.results.slice(0, 2).map((result) => (
                          <div key={result.label}>
                            <div
                              className="text-3xl font-medium tracking-tight sm:text-4xl"
                              style={{ color: study.accent }}
                            >
                              {result.value}
                            </div>
                            <div className="mt-2 max-w-[9rem] text-xs leading-relaxed text-muted-foreground">
                              {result.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
