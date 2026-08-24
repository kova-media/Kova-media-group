'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  services,
  caseStudies as fallbackCaseStudies,
  process,
  type CaseStudy,
} from '@/lib/site-data'
import { Container, Eyebrow, ButtonLink } from '@/components/site/ui'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { FlowDiagram } from '@/components/site/mockups'

/* --------------------------------------------------------------- Services preview */

/**
 * The two channels.
 *
 * This was two rounded cards in a two-column grid, each with an icon in a
 * rounded chip, a rule, a bulleted list, and a hover lift. Two cards side by
 * side is the weakest possible reading of "we do exactly two things" — it looks
 * like a grid that lost its other four tiles, and the card chrome competed with
 * the only thing that matters, which is the names of the channels.
 *
 * They are now full-width rows divided by a hairline. Each row gets the whole
 * measure, the title is set large enough to carry the claim on its own, and the
 * index numeral is plain (`1`, not `01`) and quiet. The section opens directly
 * on the headline: no label, because the headline already says what this is.
 *
 * The component still mirrors `services` one-for-one rather than slicing it.
 * The headline claims two channels and the structure has to say the same thing;
 * a third appearing in the data should be a considered decision here too, not
 * something that silently lands in the list.
 */
export function ServicesPreview() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        <Reveal className="max-w-3xl">
          <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
            Two channels. Done exceptionally well.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            We are not a full-service agency. We do email and SMS — the highest-ROI
            channels in ecommerce — and we do them better than generalists ever could.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 border-t border-border-strong md:mt-20">
          {services.map((service, i) => (
            <RevealItem key={service.slug}>
              <Link
                href="/services"
                className="group grid gap-x-12 gap-y-6 border-b border-border py-10 transition-colors duration-300 hover:border-foreground/25 md:grid-cols-[3rem_1fr_18rem] md:py-14"
              >
                <span className="font-mono text-sm text-muted-foreground tabular-nums md:pt-3">
                  {i + 1}
                </span>

                <div>
                  <h3 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    {service.title}
                    <ArrowUpRight
                      className="h-6 w-6 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand"
                      aria-hidden
                    />
                  </h3>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-foreground/80">
                    {service.summary}
                  </p>
                </div>

                <ul className="flex flex-col gap-3 md:pt-3">
                  {service.points.slice(0, 4).map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-2.5 h-px w-3 shrink-0 bg-brand" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------- Featured case studies */

/**
 * `studies` comes from the CMS via the page. It falls back to the bundled
 * content so this component still renders in isolation — and so a database
 * with no published studies never produces an empty "Selected work" section.
 *
 * The old treatment is worth naming because it was the clearest example of the
 * house style anywhere on the site: each study was a `rounded-3xl` card, and
 * inside it a panel washed with the brand's own accent colour at 8% over white,
 * with a 40×40 blurred circle of that same colour floating behind the wordmark.
 * That is a pastel card plus a gradient blob — two of the most recognisable
 * tells — and the per-study accents (a blue, an orange, a green) meant the
 * section introduced three unrelated hues purely to make the cards look
 * distinct from one another.
 *
 * Now: no cards, no wash, no blob, no per-study colour. Studies are rows on a
 * ruled list. The brand name is the largest thing in the row because the brand
 * is the proof. Figures sit inline as typography with a teal rule marking them,
 * so the one accent colour on the page is Kova's and it is marking data rather
 * than decorating a container. `study.accent` is left untouched in the content
 * layer — it is presentation, not fact, and it is simply no longer consumed.
 */
export function FeaturedCaseStudies({ studies }: { studies?: CaseStudy[] }) {
  const featured = (studies ?? fallbackCaseStudies).slice(0, 3)

  if (featured.length === 0) return null

  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        {/* The label sits opposite the index link on one line, rather than
            stacked above the headline. Same information, different move. */}
        <Reveal className="flex items-baseline justify-between gap-6 border-b border-border-strong pb-6">
          <Eyebrow>Selected work</Eyebrow>
          <Link
            href="/case-studies"
            className="group inline-flex shrink-0 items-center gap-2 text-[0.9375rem] font-medium text-foreground transition-colors hover:text-brand"
          >
            All work
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <Reveal className="mt-12 max-w-3xl">
          <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
            See our work.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            Real programs for real brands. Here is a look at how focused email and SMS
            work translates into revenue.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 md:mt-20">
          {featured.map((cs) => (
            <RevealItem key={cs.slug}>
              <Link
                href={`/case-studies/${cs.slug}`}
                className="group grid gap-x-12 gap-y-8 border-t border-border py-12 transition-colors duration-300 last:border-b hover:border-foreground/25 md:grid-cols-[1fr_auto] md:py-16"
              >
                <div className="max-w-xl">
                  <span className="text-[0.8125rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                    {cs.category}
                  </span>
                  <h3 className="mt-4 flex items-center gap-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                    {cs.brand}
                    <ArrowUpRight
                      className="h-7 w-7 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand"
                      aria-hidden
                    />
                  </h3>
                  <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
                    {cs.summary}
                  </p>
                </div>

                {/* Only the studies with verified figures show a figures row.
                    The rest let the summary do the work rather than holding
                    open a space that wants numbers in it. */}
                {cs.results.length > 0 && (
                  <div className="flex flex-wrap gap-x-12 gap-y-6 md:justify-end md:pt-1">
                    {cs.results.slice(0, 3).map((r) => (
                      <div key={r.label} className="border-t-2 border-brand pt-4">
                        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums md:text-4xl">
                          {r.value}
                        </p>
                        <p className="mt-2 max-w-[10rem] text-[0.875rem] leading-snug text-muted-foreground">
                          {r.label}
                        </p>
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
  )
}

/* ------------------------------------------------------------ Process + automation */

/**
 * The step markers were 40px bordered circles containing mono numerals, joined
 * by a vertical line — a bordered box inside a ruled column, repeated four
 * times. The numerals themselves read `01`–`04`.
 *
 * Now the numeral sits bare against a hairline that runs the height of the
 * step, which gives the same "these are sequential" reading with one element
 * instead of three. Numbers are plain. The right column carried two stacked
 * mockups (a flow diagram *and* a dashboard); the dashboard moved to the hero,
 * where it is the only artefact, so one thing here does one job.
 */
export function ProcessPreview() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-24">
          <div>
            <Reveal>
              <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl">
                A clear, four-step engagement.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">
                No mystery, no fluff. You always know what we are working on and why.
              </p>
            </Reveal>

            <div className="mt-14">
              {process.map((p, i) => (
                <Reveal key={p.step} delay={i * 0.05}>
                  <div className="grid grid-cols-[2.5rem_1fr] gap-x-6 border-t border-border py-8 last:border-b">
                    <span className="font-mono text-sm text-brand tabular-nums">
                      {p.step}
                    </span>
                    <div>
                      <h3 className="text-xl font-medium tracking-tight text-foreground">
                        {p.title}
                      </h3>
                      <p className="mt-3 max-w-md leading-relaxed text-pretty text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start lg:pt-24">
            <FlowDiagram />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------------- About preview */

/**
 * The quiet band: one statement, set large, with nothing else competing. It was
 * already the most distinctive section on the page — the only one not built out
 * of cards — so the only change is dropping the centred label above it, which
 * was the fourth eyebrow in four sections.
 */
export function AboutPreview() {
  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="text-2xl leading-[1.4] font-medium tracking-tight text-balance text-foreground md:text-4xl md:leading-[1.35]">
              Full-service agencies spread themselves thin across a dozen channels. We
              chose the opposite. By focusing only on email and SMS, we go deeper —
              better strategy, sharper copy, cleaner data, and results generalists
              can&apos;t match.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-12">
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
