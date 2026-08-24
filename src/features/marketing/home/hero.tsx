'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { Container, ButtonLink } from '@/components/site/ui'
import { RevealLines } from '@/components/site/reveal'
import { DashboardCard, MessageStream, useFloat } from '@/components/site/mockups'

const ease = [0.16, 1, 0.3, 1] as const

/** How long each message in the stream stays active. */
const SEND_INTERVAL_MS = 3400

/**
 * The homepage hero.
 *
 * There is no label above the H1. The headline is the first thing on the page,
 * and the positioning line sits below the CTAs where it qualifies the offer
 * instead of delaying the headline.
 *
 * The visual column is two panels that depict one thing happening: a campaign
 * advancing through the send list on the left, and attributed revenue moving on
 * the right in response. A single interval drives both, which is what makes the
 * pairing legible rather than two mockups that happen to animate — you can
 * watch the send land and the number move.
 *
 * On top of that, each panel drifts vertically on its own slow period, and both
 * take a different parallax rate as the section scrolls away. That is where the
 * "floating" quality comes from.
 *
 * What is deliberately not here, given how this composition looked before: no
 * `perspective`, no `preserve-3d`, no `rotateX` entry, no panels rotated a few
 * degrees and stacked on separate z-indexes to fake depth. The two panels are
 * upright and offset along the grid. They overlap by a small, fixed amount at
 * the corner because that is composition; neither is a container nested inside
 * the other, which is what the "box behind a box" problem actually was.
 *
 * Reduced motion is handled in JS, not left to the CSS backstop: `useFloat`
 * returns nothing, the parallax is not applied, and the send interval never
 * starts, so the panels render as a static, complete composition.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [sends, setSends] = useState(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // Two rates, so the panels separate slightly as the hero leaves.
  const revenueY = useTransform(scrollYProgress, [0, 1], [0, -64])
  const streamY = useTransform(scrollYProgress, [0, 1], [0, -16])

  const revenueFloat = useFloat(9, 8)
  const streamFloat = useFloat(7, 6)

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setSends((n) => n + 1), SEND_INTERVAL_MS)
    return () => clearInterval(id)
  }, [reduced])

  const active = sends % 3

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 md:pt-40">
      {/* Measured grid, masked to the top edge — ruling, not ambient glow. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-[0.55]"
        aria-hidden
      >
        <div className="grid-lines h-full w-full" />
      </div>

      <Container>
        <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Copy */}
          <div className="max-w-2xl lg:pt-6">
            <h1 className="tracking-tightest text-[3.25rem] leading-[1.02] font-semibold text-balance text-foreground md:text-7xl lg:text-[4.75rem]">
              <RevealLines
                lines={['Email & SMS', 'marketing that', 'drives revenue.']}
              />
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="mt-10 max-w-lg border-l-2 border-brand pl-6"
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
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <ButtonLink href="/book" variant="primary" withArrow>
                Book a strategy call
              </ButtonLink>
              <ButtonLink href="/case-studies" variant="secondary">
                View case studies
              </ButtonLink>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8, ease }}
              className="mt-8 text-[0.9375rem] text-muted-foreground"
            >
              Email and SMS specialists for direct-to-consumer ecommerce.
            </motion.p>
          </div>

          {/* Visual composition: send on the left, revenue on the right. */}
          <div className="relative mx-auto hidden h-[30rem] w-full max-w-[30rem] sm:block lg:h-[32rem]">
            <motion.div
              style={reduced ? undefined : { y: revenueY }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease }}
              className="absolute top-0 right-0 z-10 w-full max-w-[24rem]"
            >
              <motion.div {...revenueFloat}>
                <DashboardCard sends={sends} />
              </motion.div>
            </motion.div>

            <motion.div
              style={reduced ? undefined : { y: streamY }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease }}
              className="absolute bottom-0 left-0 z-20 w-full max-w-[21rem]"
            >
              <motion.div {...streamFloat}>
                <MessageStream active={active} />
              </motion.div>
            </motion.div>
          </div>

          {/* Below `sm` the panels stack rather than compose — an overlapping
              composition at 380px wide is just two cropped cards. */}
          <div className="flex flex-col gap-6 sm:hidden">
            <DashboardCard sends={sends} className="max-w-none" />
            <MessageStream active={active} className="max-w-none" />
          </div>
        </div>
      </Container>
    </section>
  )
}
