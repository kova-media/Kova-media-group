'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { clients, metrics, testimonials, faqs } from '@/lib/site-data'
import { Container, Eyebrow, CountUp, ButtonLink } from '@/components/site/ui'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ Client logos */

export function ClientMarquee({ heading = true }: { heading?: boolean }) {
  const row = [...clients, ...clients]
  return (
    <section className="border-y border-border bg-background py-14">
      <Container>
        {heading && (
          <Reveal>
            <p className="mb-10 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Trusted by direct-to-consumer brands
            </p>
          </Reveal>
        )}
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <motion.div
            className="flex w-max items-center gap-14"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
          >
            {row.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="whitespace-nowrap text-lg font-semibold tracking-tight text-foreground/35 transition-colors hover:text-foreground/70"
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------------------- Metrics */

export function MetricsRow() {
  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>By the numbers</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Retention is the highest-ROI channel in ecommerce.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Most brands leave that potential on the table. Here is what focused email and SMS
            work has delivered for the brands we partner with.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {metrics.map((m) => (
            <RevealItem key={m.label} className="border-t border-border-strong pt-6">
              <CountUp
                value={m.value}
                className="block text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
              />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ Testimonials */

export function Testimonials() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>Testimonials</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Trusted by the founders who hired us.
          </h2>
        </Reveal>
        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <RevealItem
              key={t.quote}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]"
            >
              <p className="text-pretty text-[1.05rem] leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-8 border-t border-border pt-5">
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------------- FAQ */

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="bg-background py-24 md:py-32">
      <Container className="max-w-4xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">FAQ</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Questions, answered.
          </h2>
        </Reveal>
        <div className="mt-14 divide-y divide-border border-y border-border">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-medium text-foreground">{item.q}</span>
                  <Plus
                    className={cn(
                      'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300',
                      isOpen && 'rotate-45',
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 text-pretty leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------------- Final CTA */

export function FinalCta() {
  return (
    <section className="bg-background pb-28 pt-8">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-20 md:px-16 md:py-28">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
              backgroundSize: '48px 48px, 64px 64px',
            }}
            aria-hidden
          />
          <Reveal className="relative mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-background/60">
              Book your strategy call
            </p>
            <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-background md:text-6xl">
              See what your brand is leaving on the table.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-background/70">
              A free call and account audit. You&apos;ll walk away with a clear plan to grow your
              email and SMS revenue — whether or not we work together.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-background px-7 py-3.5 text-[0.95rem] font-medium text-foreground transition-all duration-300 hover:bg-brand hover:text-brand-foreground"
              >
                Book a strategy call
              </Link>
              <ButtonLink
                href="/case-studies"
                variant="ghost"
                className="px-5 py-3.5 text-background/80 hover:text-background"
                withArrow
              >
                View case studies
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
