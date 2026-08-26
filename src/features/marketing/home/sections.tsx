'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { CaseStudy } from '@/lib/site-data'
import { Container, Eyebrow, ButtonLink } from '@/components/site/ui'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { FlowDiagram } from '@/components/site/mockups'
import { hasCta, type Cta } from '@/features/marketing/sections'

/**
 * The homepage bands.
 *
 * Content arrives from the CMS; composition, type and motion do not. Each band
 * drops out when it has nothing to render rather than holding open a labelled
 * blank — an editor who empties a section should see it disappear, not see a
 * heading floating over white space.
 */

/* --------------------------------------------------------------- Services preview */

export type OverviewService = {
  title: string
  summary?: string
  points?: string[]
  href?: string
}

/**
 * The two channels.
 *
 * Full-width rows divided by a hairline. Each row gets the whole measure, the
 * title is set large enough to carry the claim on its own, and the index
 * numeral is plain (`1`, not `01`) and quiet. The section opens directly on the
 * headline: no label, because the headline already says what this is.
 *
 * Two cards side by side — the previous treatment — is the weakest possible
 * reading of "we do exactly two things": it looks like a grid that lost its
 * other four tiles, and the card chrome competed with the only thing that
 * matters, which is the names of the channels.
 */
export function ServicesPreview({
  heading,
  body,
  services,
}: {
  heading?: string
  body?: string
  services?: OverviewService[]
}) {
  const items = (services ?? []).filter((service) => service.title?.trim())

  if (!heading?.trim() && items.length === 0) return null

  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        {(heading?.trim() || body?.trim()) && (
          <Reveal className="max-w-3xl">
            {heading?.trim() && (
              <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
                {heading}
              </h2>
            )}
            {body?.trim() && (
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
                {body}
              </p>
            )}
          </Reveal>
        )}

        {items.length > 0 && (
          <RevealGroup className="mt-16 border-t border-border-strong md:mt-20">
            {items.map((service, i) => (
              <RevealItem key={`${service.title}-${i}`}>
                <Link
                  href={service.href?.trim() || '/services'}
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
                    {service.summary?.trim() && (
                      <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-foreground/80">
                        {service.summary}
                      </p>
                    )}
                  </div>

                  {(service.points ?? []).length > 0 && (
                    <ul className="flex flex-col gap-3 md:pt-3">
                      {(service.points ?? [])
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-muted-foreground"
                          >
                            <span
                              className="mt-2.5 h-px w-3 shrink-0 bg-brand"
                              aria-hidden
                            />
                            {point}
                          </li>
                        ))}
                    </ul>
                  )}
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------- Featured case studies */

/**
 * `studies` comes from the CMS — the case studies edited under Case studies,
 * in their configured order.
 *
 * The old treatment is worth naming because it was the clearest example of the
 * house style anywhere on the site: each study was a `rounded-3xl` card, and
 * inside it a panel washed with the brand's own accent colour at 8% over white,
 * with a 40×40 blurred circle of that same colour floating behind the wordmark.
 * That is a pastel card plus a gradient blob — two of the most recognisable
 * tells — and the per-study accents meant the section introduced three
 * unrelated hues purely to make the cards look distinct from one another.
 *
 * Now: no cards, no wash, no blob, no per-study colour. Studies are rows on a
 * ruled list. The brand name is the largest thing in the row because the brand
 * is the proof. Figures sit inline as typography with a teal rule marking them,
 * so the one accent colour on the page is Kova's and it is marking data rather
 * than decorating a container.
 */
export function FeaturedCaseStudies({
  eyebrow,
  allWorkLabel,
  heading,
  body,
  limit = 3,
  studies,
}: {
  eyebrow?: string
  allWorkLabel?: string
  heading?: string
  body?: string
  limit?: number
  studies?: CaseStudy[]
}) {
  const featured = (studies ?? []).slice(0, Math.max(1, limit))

  if (featured.length === 0) return null

  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        {/* The label sits opposite the index link on one line, rather than
            stacked above the headline. Same information, different move. */}
        {(eyebrow?.trim() || allWorkLabel?.trim()) && (
          <Reveal className="flex items-baseline justify-between gap-6 border-b border-border-strong pb-6">
            {eyebrow?.trim() ? <Eyebrow>{eyebrow}</Eyebrow> : <span />}
            {allWorkLabel?.trim() && (
              <Link
                href="/case-studies"
                className="group inline-flex shrink-0 items-center gap-2 text-[0.9375rem] font-medium text-foreground transition-colors hover:text-brand"
              >
                {allWorkLabel}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
          </Reveal>
        )}

        {(heading?.trim() || body?.trim()) && (
          <Reveal className="mt-12 max-w-3xl">
            {heading?.trim() && (
              <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
                {heading}
              </h2>
            )}
            {body?.trim() && (
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
                {body}
              </p>
            )}
          </Reveal>
        )}

        <RevealGroup className="mt-16 md:mt-20">
          {featured.map((cs) => (
            <RevealItem key={cs.slug}>
              <Link
                href={`/case-studies/${cs.slug}`}
                className="group grid gap-x-12 gap-y-8 border-t border-border py-12 transition-colors duration-300 last:border-b hover:border-foreground/25 md:grid-cols-[1fr_auto] md:py-16"
              >
                <div className="max-w-xl">
                  {cs.category && (
                    <span className="text-[0.8125rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                      {cs.category}
                    </span>
                  )}
                  <h3 className="mt-4 flex items-center gap-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                    {cs.brand}
                    <ArrowUpRight
                      className="h-7 w-7 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand"
                      aria-hidden
                    />
                  </h3>
                  {cs.summary && (
                    <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
                      {cs.summary}
                    </p>
                  )}
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

export type ProcessStep = { title: string; description?: string }

/**
 * The numeral sits bare against a hairline that runs the height of the step,
 * which gives the "these are sequential" reading with one element instead of
 * the three it used to take (a bordered, shadowed circle on a connector line).
 * Numbers are plain — `2`, not `02` — and they are derived from position, so an
 * editor reordering the steps never has to renumber anything.
 */
export function ProcessPreview({
  heading,
  body,
  steps,
}: {
  heading?: string
  body?: string
  steps?: ProcessStep[]
}) {
  const items = (steps ?? []).filter((step) => step.title?.trim())

  if (!heading?.trim() && items.length === 0) return null

  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-24">
          <div>
            {(heading?.trim() || body?.trim()) && (
              <Reveal>
                {heading?.trim() && (
                  <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl">
                    {heading}
                  </h2>
                )}
                {body?.trim() && (
                  <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">
                    {body}
                  </p>
                )}
              </Reveal>
            )}

            <div className="mt-14">
              {items.map((p, i) => (
                <Reveal key={`${p.title}-${i}`} delay={i * 0.05}>
                  <div className="grid grid-cols-[2.5rem_1fr] gap-x-6 border-t border-border py-8 last:border-b">
                    <span className="font-mono text-sm text-brand tabular-nums">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-xl font-medium tracking-tight text-foreground">
                        {p.title}
                      </h3>
                      {p.description?.trim() && (
                        <p className="mt-3 max-w-md leading-relaxed text-pretty text-muted-foreground">
                          {p.description}
                        </p>
                      )}
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

/* ---------------------------------------------------------------- Statement band */

/**
 * The quiet band: one statement, set large, with nothing else competing. It is
 * the only section on the page not built out of rows or rules, which is exactly
 * why it works — and why it carries no label above it.
 */
export function AboutPreview({ statement, cta }: { statement?: string; cta?: Cta }) {
  if (!statement?.trim()) return null

  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="text-2xl leading-[1.4] font-medium tracking-tight text-balance text-foreground md:text-4xl md:leading-[1.35]">
              {statement}
            </p>
          </Reveal>
          {hasCta(cta) && (
            <Reveal delay={0.1}>
              <div className="mt-12">
                <ButtonLink href={cta.href} variant="secondary" withArrow>
                  {cta.label}
                </ButtonLink>
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  )
}
