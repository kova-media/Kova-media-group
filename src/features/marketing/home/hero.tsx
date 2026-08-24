'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { Container, ButtonLink } from '@/components/site/ui'
import { RevealLines } from '@/components/site/reveal'
import { HeroProgramme } from './hero-visual'

const ease = [0.16, 1, 0.3, 1] as const

/**
 * The homepage hero.
 *
 * Composition. Copy-left / widget-right is the default arrangement of every
 * agency and SaaS homepage, and it forces whatever sits on the right into a
 * narrow column — which is most of why the previous versions kept becoming a
 * stack of panels. So the axis changed: the headline gets the full measure and
 * the composition runs the full width beneath it, as a band. That is an
 * editorial masthead, and it is the part of this that is hardest to mistake for
 * another site.
 *
 * The visual is `HeroProgramme` — a customer lifecycle drawn as a broadcast
 * score. See that file for why a programme rather than a dashboard.
 *
 * There is no label above the H1; the headline is the first text on the page.
 * The positioning line that used to sit under the CTAs is gone too — the
 * composition below now says "Email" and "SMS" in the work itself, so the line
 * was repeating what the page already shows.
 *
 * Nothing here invents a figure. No revenue, no rates, no recipient counts, no
 * campaign names. The previous hero carried all of those and they were
 * fabricated; `docs/DESIGN.md` and the content commits behind it are explicit
 * that this site does not do that.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // The band drifts slightly slower than the copy as the hero leaves, which
  // separates the two without either one moving enough to notice directly.
  const bandY = useTransform(scrollYProgress, [0, 1], [0, -40])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pt-32 pb-8 md:pt-40 md:pb-12"
    >
      {/* Measured grid, masked to the top edge — ruling, not ambient glow. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-[0.55]"
        aria-hidden
      >
        <div className="grid-lines h-full w-full" />
      </div>

      <Container>
        <div className="max-w-4xl">
          <h1 className="tracking-tightest text-[3.25rem] leading-[1.02] font-semibold text-balance text-foreground md:text-7xl lg:text-[5.25rem]">
            <RevealLines lines={['Email & SMS', 'marketing that', 'drives revenue.']} />
          </h1>

          <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto] md:items-end md:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="max-w-lg border-l-2 border-brand pl-6"
            >
              <p className="text-lg leading-relaxed text-pretty text-foreground/80">
                We help ecommerce brands generate more revenue from the customers they
                already have — through high-performing campaigns, intelligent
                automations, and strategic SMS.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <ButtonLink href="/book" variant="primary" withArrow>
                Book a strategy call
              </ButtonLink>
              <ButtonLink href="/case-studies" variant="secondary">
                View case studies
              </ButtonLink>
            </motion.div>
          </div>
        </div>
      </Container>

      {/* The programme, running the full width beneath the masthead. */}
      <motion.div
        style={reduced ? undefined : { y: bandY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.75, ease }}
        className="mt-20 border-t border-border pt-14 md:mt-28 md:pt-20"
      >
        <Container>
          <HeroProgramme />
        </Container>
      </motion.div>
    </section>
  )
}
