'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { Container, CountUp, ButtonLink } from '@/components/site/ui'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { cn } from '@/lib/utils'

/**
 * The bands shared across more than one page.
 *
 * Every word, figure and link in this file arrives as a prop from the CMS.
 * There are **no copy fallbacks** — a component that quietly substitutes its
 * own sentence when the database is empty makes the admin look broken, because
 * the editor deletes a line and the site keeps showing it. What each band does
 * instead is drop out cleanly when it has nothing to say, which is the same
 * rule the content commits already established for testimonials and figures.
 *
 * Structure, spacing, type and motion stay here and stay closed. That is the
 * split in CMS.md §1 and it is what keeps the site from degrading into
 * whatever a page builder produces.
 */

export type Cta = { label: string; href: string }

/** A CTA is shown only when it has both halves. Never `href=""`. */
export function hasCta(cta: Cta | undefined | null): cta is Cta {
  return Boolean(cta?.label?.trim() && cta?.href?.trim())
}

/* ------------------------------------------------------------- Client logos */

export function ClientMarquee({
  caption,
  clients,
}: {
  caption?: string
  clients?: string[]
}) {
  const names = (clients ?? []).map((name) => name.trim()).filter(Boolean)

  // The marquee is the names. With none there is nothing to scroll, and an
  // empty bordered band would read as a broken section.
  if (names.length === 0) return null

  return (
    <section className="border-y border-border bg-background py-10">
      <Container>
        {caption?.trim() && (
          <Reveal>
            <p className="mb-10 text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase">
              {caption}
            </p>
          </Reveal>
        )}
        <div className="flex flex-wrap gap-x-14 gap-y-4">
          {names.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-lg font-semibold text-foreground/70"
            >
              {name}
            </span>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------------------- Metrics */

export function MetricsRow({
  heading,
  figures,
}: {
  heading?: string
  figures?: { value: string; label: string }[]
}) {
  const items = (figures ?? []).filter((figure) => figure.value.trim())

  // The figures are the row, same as the names are the marquee. With none the
  // band would be an empty shell, so it drops out too.
  if (items.length === 0) return null

  return (
    <section className="border-b border-border bg-background py-16">
      <Container>
        {heading?.trim() && (
          <Reveal>
            <p className="mb-12 text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/60 uppercase">
              {heading}
            </p>
          </Reveal>
        )}
        <RevealGroup className="grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-4">
          {items.map((figure) => (
            <RevealItem key={figure.label}>
              <p className="text-4xl font-medium tracking-[-0.02em] text-foreground sm:text-5xl">
                <CountUp to={figure.value} />
              </p>
              <p className="mt-3 text-[0.8125rem] font-medium tracking-[0.06em] text-foreground/60 uppercase">
                {figure.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------- Testimonials */

export function Testimonials({
  heading,
  quotes,
}: {
  heading?: string
  quotes?: { quote: string; name: string; role?: string }[]
}) {
  const items = (quotes ?? []).filter((quote) => quote.quote.trim())

  // The quotes are the section, same as the names are the marquee.
  if (items.length === 0) return null

  return (
    <section className="border-b border-border bg-background py-24">
      <Container>
        {heading?.trim() && (
          <Reveal>
            <h2 className="max-w-2xl text-3xl leading-[1.08] font-medium tracking-[-0.02em] text-balance sm:text-[2.75rem]">
              {heading}
            </h2>
          </Reveal>
        )}
        <RevealGroup className="mt-14 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {items.map((item) => (
            <RevealItem key={item.quote}>
              <figure className="flex h-full flex-col justify-between gap-10 border-t border-border pt-8">
                <blockquote className="text-xl leading-relaxed font-medium tracking-[-0.01em] text-foreground/85">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <p className="text-[0.9375rem] font-semibold text-foreground">
                    {item.name}
                  </p>
                  {item.role?.trim() && (
                    <p className="mt-1 text-sm text-foreground/60">{item.role}</p>
                  )}
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------------------- FAQ */

export function Faq({
  heading,
  items,
}: {
  heading?: string
  items?: { question: string; answer: string }[]
}) {
  const [open, setOpen] = useState<number | null>(null)
  const rows = (items ?? []).filter((item) => item.question.trim())

  // Same rule as the other bands: the questions are the section, so an empty
  // FAQ drops out instead of rendering an empty bordered box.
  if (rows.length === 0) return null

  return (
    <section className="border-b border-border bg-background py-24">
      <Container>
        {heading?.trim() && (
          <Reveal>
            <h2 className="mb-12 text-3xl leading-[1.08] font-medium tracking-[-0.02em] text-balance sm:text-[2.75rem]">
              {heading}
            </h2>
          </Reveal>
        )}
        <div>
          {rows.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.question} className="border-t border-border last:border-b">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="text-lg font-medium tracking-[-0.01em] text-foreground">
                    {item.question}
                  </span>
                  <Plus
                    className={cn(
                      'size-5 shrink-0 text-foreground/60 transition-transform duration-300',
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
                      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pr-10 pb-8 leading-relaxed text-foreground/70">
                        {item.answer}
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

/* ---------------------------------------------------------------- Final CTA */

export function FinalCta({
  heading,
  intro,
  cta,
}: {
  heading?: string
  intro?: string
  cta?: Cta
}) {
  if (!heading?.trim() && !intro?.trim() && !hasCta(cta)) return null

  return (
    <section className="bg-background py-24 sm:py-28">
      <Container className="flex flex-col items-start gap-8">
        {heading?.trim() && (
          <Reveal>
            <h2 className="max-w-3xl text-4xl leading-[1.05] font-medium tracking-[-0.03em] text-balance sm:text-6xl">
              {heading}
            </h2>
          </Reveal>
        )}
        {intro?.trim() && (
          <Reveal delay={0.08}>
            <p className="max-w-2xl text-lg leading-relaxed text-foreground/70">
              {intro}
            </p>
          </Reveal>
        )}
        {hasCta(cta) && (
          <Reveal delay={0.16}>
            <ButtonLink href={cta.href} size="lg">
              {cta.label}
            </ButtonLink>
          </Reveal>
        )}
      </Container>
    </section>
  )
}
