'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Container, ButtonLink } from '@/components/site/ui'
import { RevealLines } from '@/components/site/reveal'
import { DashboardCard, EmailCard, SmsCard } from '@/components/site/mockups'

const ease = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // Parallax + slow rotation driven by scroll.
  const dashY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const dashRotate = useTransform(scrollYProgress, [0, 1], [0, -6])
  const emailY = useTransform(scrollYProgress, [0, 1], [0, -140])
  const smsY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const compScale = useTransform(scrollYProgress, [0, 1], [1, 1.04])

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 md:pt-40">
      {/* faint background grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)] opacity-[0.5]"
        aria-hidden
      >
        <div className="grid-lines h-full w-full" />
      </div>

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              Email &amp; SMS specialists
            </motion.p>

            <h1 className="tracking-tightest mt-6 text-5xl leading-[1.02] font-semibold text-balance text-foreground md:text-6xl lg:text-[4.25rem]">
              <RevealLines
                lines={['Email & SMS', 'marketing that', 'drives revenue.']}
              />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="mt-7 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground"
            >
              We help ecommerce brands generate more revenue from the customers they
              already have — through high-performing campaigns, intelligent automations,
              and strategic SMS.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <ButtonLink href="/book" variant="primary" withArrow>
                Book a strategy call
              </ButtonLink>
              <ButtonLink href="/case-studies" variant="secondary">
                View case studies
              </ButtonLink>
            </motion.div>
          </div>

          {/* Visual composition */}
          <motion.div
            style={{ scale: compScale }}
            className="relative mx-auto h-[440px] w-full max-w-[460px] [perspective:1600px] lg:h-[520px]"
          >
            <motion.div
              style={{ y: dashY, rotate: dashRotate }}
              initial={{ opacity: 0, y: 40, rotateX: 12 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.3, ease }}
              className="absolute top-4 right-0 z-20 [transform-style:preserve-3d]"
            >
              <DashboardCard />
            </motion.div>

            <motion.div
              style={{ y: emailY }}
              initial={{ opacity: 0, y: 30, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 1, delay: 0.55, ease }}
              className="absolute bottom-6 left-0 z-10 hidden sm:block"
            >
              <EmailCard className="w-[210px] rotate-[-5deg]" />
            </motion.div>

            <motion.div
              style={{ y: smsY }}
              initial={{ opacity: 0, y: 30, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 1, delay: 0.7, ease }}
              className="absolute right-4 -bottom-4 z-30 hidden sm:block"
            >
              <SmsCard className="w-[200px] rotate-[4deg]" />
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
