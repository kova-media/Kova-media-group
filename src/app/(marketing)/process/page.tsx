import type { Metadata } from 'next'
import { process } from '@/lib/site-data'
import { Container, Eyebrow } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { FlowDiagram } from '@/components/site/mockups'
import { FinalCta } from '@/features/marketing/sections'

export const metadata: Metadata = {
  title: 'Process',
  description:
    'Our four-step process for building email and SMS programs that compound: Audit, Strategy, Execution, and Optimization.',
}

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Process"
        title="A clear, repeatable path from audit to compounding revenue."
        description="No mystery, no black box. Here is exactly how we take a program from where it is today to a channel you can count on."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
            <div>
              <RevealGroup className="flex flex-col">
                {process.map((item) => (
                  <RevealItem key={item.step}>
                    {/* The step marker was a bordered, shadowed circle on a
                        connector line: three elements to say "step 2". The
                        numeral now sits bare in its own column against the rule
                        that divides the steps, which says the same thing with
                        one. Numbers are plain — `2`, not `02`. */}
                    <div className="grid grid-cols-[3rem_1fr] gap-x-6 border-t border-border py-9 last:border-b">
                      <span className="font-mono text-sm text-brand tabular-nums">
                        {item.step}
                      </span>
                      <div>
                        <h2 className="text-2xl font-medium tracking-tight text-foreground">
                          {item.title}
                        </h2>
                        <p className="mt-3 max-w-xl leading-relaxed text-pretty text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <Eyebrow>What we build</Eyebrow>
                <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
                  A typical automation suite recovers revenue around the clock. Here is
                  a simplified view of the flows we design and connect.
                </p>
                <div className="mt-8">
                  <FlowDiagram />
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <FinalCta />
    </>
  )
}
