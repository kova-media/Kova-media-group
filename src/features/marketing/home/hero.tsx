'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ButtonLink, Container, Eyebrow } from '@/components/site/ui'
import { RevealLines } from '@/components/site/reveal'
import { hasCta, type Cta } from '@/features/marketing/sections'

const ease = [0.16, 1, 0.3, 1] as const

/**
 * The homepage hero.
 *
 * Copy on the left, the Zilkee results on the right. The right column is not
 * a mockup and not an illustration: it is the Zilkee case study's own
 * results — its first three figures, the window they cover, and a link to
 * the study — resolved from the case-study rows the page already loads, so
 * the hero always matches the live study. When Zilkee is unpublished the
 * block drops out and the hero is headline-only.
 *
 * The figures render as plain text, in the same ruled-figure treatment the
 * case-study rows use: a teal rule, a big figure, a label beneath. No
 * CountUp — a static figure needs no animation and must be readable
 * server-side with no JS.
 *
 * There is no label above the H1 — the headline is the first text on the page.
 * The paragraph sits plain, with no rule beside it.
 *
 * The words come from the CMS; everything above does not. The headline arrives
 * as one string and is split on its line breaks, because the line-by-line
 * reveal makes those breaks real content — an editor decides where the headline
 * turns by pressing Enter, which is a thing anyone understands, and never
 * touches the animation that reveals it.
 */
export function Hero({
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  results,
  resultsPeriod,
  slug,
}: {
  headline?: string
  subhead?: string
  primaryCta?: Cta
  secondaryCta?: Cta
  /** The Zilkee study's first three results, resolved by the section renderer. */
  results?: { value: string; label: string }[]
  /** The window the figures cover, e.g. "November 2024 – July 2025". */
  resultsPeriod?: string
  /** The Zilkee study's slug, for the link to the case study. */
  slug?: string
}) {
  const lines = (headline ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const reduced = useReducedMotion()
  const still = reduced === true
  const caseStudy =
  results && results.length > 0 && slug ? { results, resultsPeriod, slug } : null
  const eyebrowLabel = caseStudy?.resultsPeriod
    ? `Zilkee — ${caseStudy.resultsPeriod}`
    : 'Zilkee'

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Measured grid, masked to the top edge — ruling, not ambient glow. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-[0.55]"
        aria-hidden
      >
        <div className="grid-lines h-full w-full" />
      </div>

      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          {/* Copy */}
          <div className="max-w-xl">
            {lines.length > 0 && (
              <h1 className="tracking-tightest text-[3.25rem] leading-[1.02] font-semibold text-balance text-foreground md:text-6xl lg:text-[4.5rem]">
                <RevealLines lines={lines} />
              </h1>
            )}

            {subhead?.trim() && (
              <motion.p
                initial={still ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease }}
                className="mt-8 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground"
              >
                {subhead}
              </motion.p>
            )}

            {(hasCta(primaryCta) || hasCta(secondaryCta)) && (
              <motion.div
                initial={still ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.65, ease }}
                className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                {hasCta(primaryCta) && (
                  <ButtonLink href={primaryCta.href} variant="primary" withArrow>
                    {primaryCta.label}
                  </ButtonLink>
                )}
                {hasCta(secondaryCta) && (
                  <ButtonLink href={secondaryCta.href} variant="secondary">
                    {secondaryCta.label}
                  </ButtonLink>
                )}
              </motion.div>
            )}
          </div>

          {caseStudy && (
            <div>
              <Eyebrow>{eyebrowLabel}</Eyebrow>

              <div className="mt-8 flex flex-col gap-10">
                {caseStudy.results.map((result) => (
                  <div
                    key={`${result.label}-${result.value}`}
                    className="border-t-2 border-brand pt-6"
                  >
                    <p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
                      {result.value}
                    </p>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                      {result.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={`/case-studies/${caseStudy.slug}`}
                className="mt-10 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-foreground transition-colors hover:text-brand"
              >
                Read the Zilkee case study →
              </Link>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
