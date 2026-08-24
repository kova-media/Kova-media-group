import type { Metadata } from 'next'
import { metrics } from '@/lib/site-data'
import { Container, Eyebrow, CountUp } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { Testimonials, FinalCta } from '@/features/marketing/sections'
import { getTestimonialList } from '@/server/content/site-content'

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

export default async function AboutPage() {
  const quotes = await getTestimonialList()

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A focused agency for one of your most valuable channels."
        description="Kova Media Group exists to make email and SMS pull real weight for ecommerce brands. We believe owned channels deserve a specialist, not a checkbox."
      />

      {/* The figures band renders only when there are verified figures to put
          in it. It is empty today: the four statistics that used to sit here
          were never sourced, and a band of numbers is worth nothing if the
          numbers are not. `values` below carries the page on its own. */}
      {metrics.length > 0 && (
        <section className="pb-8">
          <Container>
            {/* Figures on rules, not in a gap-px tile mosaic. The mosaic is the
                bento shape: equal boxes whose only job is to look arranged. */}
            <Reveal>
              <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="border-t-2 border-brand pt-6">
                    <div className="text-4xl font-semibold tracking-tight text-foreground tabular-nums md:text-5xl">
                      <CountUp value={metric.value} />
                    </div>
                    <div className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <Eyebrow>What we believe</Eyebrow>
              <p className="mt-7 text-2xl leading-[1.35] font-medium tracking-tight text-balance text-foreground sm:text-3xl">
                Retention is where great brands are built. We help ecommerce companies
                turn subscribers into repeat customers — and treat every send like it
                matters.
              </p>
            </Reveal>

            {/* Four values were four bordered tiles in a 2×2 — the bento shape
                again, and at that size the body copy was `text-sm` inside a
                box, which is the small-and-faint problem too. They are now a
                single ruled column: full measure, readable, and the vertical
                rhythm does the separating. */}
            <RevealGroup className="flex flex-col">
              {values.map((value) => (
                <RevealItem key={value.title}>
                  <div className="grid gap-x-10 gap-y-3 border-t border-border py-8 last:border-b sm:grid-cols-[13rem_1fr]">
                    <h3 className="text-lg font-medium tracking-tight text-balance text-foreground">
                      {value.title}
                    </h3>
                    <p className="max-w-xl leading-relaxed text-pretty text-muted-foreground">
                      {value.body}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      <Testimonials quotes={quotes} />
      <FinalCta />
    </>
  )
}
