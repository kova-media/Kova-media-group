'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Container, ButtonLink } from '@/components/site/ui'
import { RevealLines } from '@/components/site/reveal'
import { DashboardCard } from '@/components/site/mockups'

const ease = [0.16, 1, 0.3, 1] as const

/**
 * The homepage hero.
 *
 * What changed and why. The visual column used to be three mockup cards flown
 * in 3D — `perspective: 1600px`, `preserve-3d`, an entry `rotateX`, and two
 * siblings rotated a few degrees and stacked on z-10/20/30. That is the
 * "box behind a box" depth trick, and it was doing the work the typography
 * should do: it made the composition busy, it made the mockups unreadable at
 * their rotation, and it is the single most recognisable tell of the current
 * agency-site house style.
 *
 * It is now one artefact, flat, on the grid, with the product surface legible
 * because that is the actual argument — Kova reports attributed revenue. A
 * single parallax offset survives, because moving the panel slightly against
 * the copy as you scroll clarifies which column is fixed and which is content.
 * There is no rotation and no stack.
 *
 * The badge above the headline is gone too. A pill-shaped, dot-prefixed,
 * uppercase micro-label above an H1 is the eyebrow formula in its purest form.
 * The same information now sits *below* the CTAs as a plain line of text, where
 * it qualifies the offer instead of delaying the headline.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const panelY = useTransform(scrollYProgress, [0, 1], [0, -48])

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
        <div className="grid items-start gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* Copy */}
          <div className="max-w-2xl">
            <h1 className="tracking-tightest text-[3.25rem] leading-[1.02] font-semibold text-balance text-foreground md:text-7xl lg:text-[5rem]">
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

          {/* One artefact, flat and legible. */}
          <motion.div
            style={{ y: panelY }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease }}
            className="hidden lg:block lg:pt-4"
          >
            <DashboardCard className="ml-auto" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
