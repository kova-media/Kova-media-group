'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Container, ButtonLink } from '@/components/site/ui'
import { RevealLines } from '@/components/site/reveal'
import {
  DashboardCard,
  EmailCard,
  SmsCard,
  type EmailPreview,
  type ReportPanel,
  type SmsPreview,
} from '@/components/site/mockups'
import { hasCta, type Cta } from '@/features/marketing/sections'

const ease = [0.16, 1, 0.3, 1] as const

/** How often the composition replays: email send, then SMS reply. */
const BEAT_MS = 5200

/**
 * The homepage hero.
 *
 * Copy on the left, the working composition on the right. The composition is
 * the reporting panel, an email preview and an SMS thread, layered and set at
 * slight angles against each other.
 *
 * The part that keeps it from reading as three stock cards on a page is that
 * they are choreographed rather than separately animated. One `beat` runs the
 * whole thing: the email's CTA lifts, and about half a second later the reply
 * lands in the SMS thread beside it. You are watching a send and a response,
 * not three panels that happen to have entrance transitions. The bars grow in
 * on arrival; the figures are fixed and do not drift while you watch.
 *
 * Depth is used, and used with a light hand: a shallow perspective, a few
 * degrees of rotation on the two smaller panels, and three z-levels so the
 * stack has a front and a back. Two parallax rates on scroll separate the
 * panels as the hero leaves.
 *
 * There is no label above the H1 — the headline is the first text on the page.
 * The paragraph sits plain, with no rule beside it.
 *
 * Under reduced motion nothing moves: the beat never starts, parallax is not
 * applied, and every entrance renders at its end state rather than fading in.
 * That last part matters beyond preference — an entrance that animates opacity
 * from zero leaves the content invisible for anyone whose JavaScript is slow or
 * blocked, which is the failure mode CODING_STANDARDS warns about. The tilt
 * stays: a static transform is geometry, not motion.
 *
 * The words come from the CMS; everything above does not. The headline arrives
 * as one string and is split on its line breaks, because the line-by-line
 * reveal makes those breaks real content — an editor decides where the headline
 * turns by pressing Enter, which is a thing anyone understands, and never
 * touches the animation that reveals it.
 */
export type HeroArtwork = {
  report?: ReportPanel
  email?: EmailPreview
  sms?: SmsPreview
}

export function Hero({
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  artwork,
}: {
  headline?: string
  subhead?: string
  primaryCta?: Cta
  secondaryCta?: Cta
  artwork?: HeroArtwork
}) {
  const lines = (headline ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const still = reduced === true
  const [beat, setBeat] = useState(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const dashY = useTransform(scrollYProgress, [0, 1], [0, -70])
  const emailY = useTransform(scrollYProgress, [0, 1], [0, -130])
  const smsY = useTransform(scrollYProgress, [0, 1], [0, 60])

  useEffect(() => {
    if (still) return
    const id = setInterval(() => setBeat((n) => n + 1), BEAT_MS)
    return () => clearInterval(id)
  }, [still])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28"
    >
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

          {/* Composition.
              The three panels are placed as one cluster, not three pinned
              corners. The reporting panel anchors the top right; the email
              overlaps its lower-left corner; the SMS thread overlaps the
              email's lower-right and sits in front of both. Every panel
              touches at least one other, which is what makes it read as a
              stack rather than as three cards adrift in a column. */}
          <div
            className="relative mx-auto w-full max-w-[33rem] sm:h-[30rem]"
            style={still ? undefined : { perspective: '1600px' }}
          >
            {/* Reporting panel — top right, back of the stack. */}
            <motion.div
              style={still ? undefined : { y: dashY }}
              initial={still ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease }}
              className="mx-auto w-full max-w-[21rem] sm:absolute sm:top-0 sm:right-0 sm:z-20 sm:mx-0 sm:w-[22rem] sm:max-w-none"
            >
              <DashboardCard className="max-w-none" {...(artwork?.report ?? {})} />
            </motion.div>

            {/* Email preview — behind the reporting panel, peeking out to the
                left. It sits at the back deliberately: the reporting panel is
                the anchor of the composition and cropping its stats row to put
                the email in front made the one element that has to stay
                readable unreadable. */}
            <motion.div
              style={still ? undefined : { y: emailY }}
              initial={still ? false : { opacity: 0, y: 32, x: -24 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 1, delay: 0.55, ease }}
              className="absolute top-[6.5rem] left-0 z-0 hidden w-[14.5rem] sm:block"
            >
              <EmailCard
                beat={beat}
                className={panel('-rotate-[3.5deg]')}
                {...(artwork?.email ?? {})}
              />
            </motion.div>

            {/* SMS thread — front of the stack, tilted the other way so the two
                smaller panels lean against each other rather than in parallel. */}
            <motion.div
              style={still ? undefined : { y: smsY }}
              initial={still ? false : { opacity: 0, y: 32, x: 24 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 1, delay: 0.7, ease }}
              className="absolute right-[2.5rem] bottom-0 z-30 hidden w-[13.5rem] sm:block"
            >
              <SmsCard
                beat={beat}
                className={panel('rotate-[3deg]')}
                {...(artwork?.sms ?? {})}
              />
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/**
 * Panel sizing and tilt. The rotation is kept under reduced motion: a static
 * transform is not movement, and `prefers-reduced-motion` is a request about
 * things that move, not about geometry. Dropping it would change the
 * composition for those visitors rather than calming it.
 */
function panel(rotation: string) {
  return cn('w-full max-w-none', rotation)
}
