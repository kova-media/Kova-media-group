import type { Metadata } from 'next'
import { metrics } from '@/lib/site-data'
import { Container, Eyebrow, CountUp } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { Testimonials, FinalCta } from '@/features/marketing/sections'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Kova Media Group is a specialist email and SMS marketing agency for ecommerce brands. Focused, in-house, and accountable to revenue.',
}

const values = [
  {
    title: 'Specialists, not generalists',
    body: 'We do email and SMS — nothing else. That focus is why our clients get more from these channels than a full-service agency could deliver.',
  },
  {
    title: 'Revenue over vanity metrics',
    body: 'Opens and clicks are means, not ends. We report on what these channels actually contribute to the business, every single week.',
  },
  {
    title: 'Everything in-house',
    body: 'Strategy, design, copy, and analysis are handled by our own team. Nothing is outsourced, so quality stays consistent and accountable.',
  },
  {
    title: 'A true extension of your team',
    body: 'We learn your brand deeply and communicate clearly. You always know what we are working on and why it matters.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A focused agency for one of your most valuable channels."
        description="Kova Media Group exists to make email and SMS pull real weight for ecommerce brands. We believe owned channels deserve a specialist, not a checkbox."
      />

      <section className="pb-8">
        <Container>
          <Reveal>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="bg-card p-8">
                  <div className="text-4xl font-medium tracking-tight text-primary">
                    <CountUp value={metric.value} />
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <Reveal>
              <Eyebrow>What we believe</Eyebrow>
              <p className="mt-6 text-2xl font-light leading-relaxed text-foreground text-balance sm:text-3xl">
                Retention is where great brands are built. We help ecommerce companies turn
                subscribers into repeat customers — and treat every send like it matters.
              </p>
            </Reveal>

            <RevealGroup className="grid gap-5 sm:grid-cols-2">
              {values.map((value) => (
                <RevealItem key={value.title}>
                  <div className="h-full rounded-xl border border-border bg-card p-7">
                    <h3 className="text-lg font-medium tracking-tight">{value.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {value.body}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      <Testimonials />
      <FinalCta />
    </>
  )
}
