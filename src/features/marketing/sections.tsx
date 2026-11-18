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

/* ------------------------------------------------------------------ Client logos */

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

  const row = [...names, ...names]

  return (
    <section className="border-y border-border bg-background py-14">
      <Container>
        {caption?.trim() && (
          <Reveal>
            <p className="mb-10 text-center text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase">
              {caption}
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
                className="text-lg font-semibold tracking-tight whitespace-nowrap text-foreground/35 transition-colors hover:text-foreground/70"
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

/**
 * The "by the numbers" band.
 *
 * The whole section *is* the numbers — there is no version of it that works
 * with the figures removed and the heading left standing — so it renders
 * nothing at all until the CMS holds at least one. It is empty today: the four
 * figures this band once carried were never sourced.
 */
export function MetricsRow({
  heading,
  body,
  metrics,
}: {
  heading?: string
  body?: string
  metrics?: { value: string; label: string }[]
}) {
  const figures = (metrics ?? []).filter((m) => m.value?.trim() && m.label?.trim())

  if (figures.length === 0) return null

  return (
    <section className="bg-background py-24 md:py-32">
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

        <RevealGroup
          className={cn(
            'grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-4',
            heading?.trim() || body?.trim() ? 'mt-16 md:mt-20' : '',
          )}
        >
          {figures.map((m) => (
            <RevealItem key={m.label} className="border-t-2 border-brand pt-6">
              <CountUp
                value={m.value}
                className="block text-5xl font-semibold tracking-tight text-foreground tabular-nums md:text-6xl"
              />
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {m.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ Testimonials */

/**
 * Client testimonials, from the CMS library.
 *
 * **Renders nothing when there are none, by design.** There is no bundled
 * fallback and there must never be one: a testimonial is a claim about a real
 * person's experience, and inventing one to fill a layout is a different
 * category of thing from writing marketing copy.
 *
 * Attribution renders exactly as stored, including quotes attributed by role
 * rather than by name where that is how the client gave them.
 */
export function Testimonials({
  heading,
  quotes,
}: {
  heading?: string
  quotes?: { quote: string; name: string; role: string }[]
}) {
  const testimonials = quotes ?? []

  if (testimonials.length === 0) return null

  return (
    <section className="bg-surface py-24 md:py-32">
      <Container>
        {heading?.trim() && (
          <Reveal className="max-w-3xl">
            <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl">
              {heading}
            </h2>
          </Reveal>
        )}
        {/* Quotes are set as quotes, not as cards: a teal rule opens each one,
            the type is large enough to actually be read, and attribution sits
            on a single line beneath. Three bordered boxes in a row would put
            this section in the same shape as every other one on the site. */}
        <RevealGroup
          className={cn(
            'grid gap-x-12 gap-y-14',
            heading?.trim() ? 'mt-14 md:mt-20' : '',
            // Match the column count to what actually exists: two real quotes
            // in a three-column grid reads as a missing third.
            testimonials.length >= 3
              ? 'md:grid-cols-3'
              : testimonials.length === 2
                ? 'md:grid-cols-2'
                : 'max-w-3xl',
          )}
        >
          {testimonials.map((t) => (
            <RevealItem
              key={t.quote}
              className="flex flex-col border-t-2 border-brand pt-7"
            >
              <p className="text-xl leading-[1.5] text-pretty text-foreground">
                {t.quote}
              </p>
              <p className="mt-7 text-[0.9375rem] text-muted-foreground">
                <span className="font-medium text-foreground">{t.name}</span>
                {t.role ? `, ${t.role}` : ''}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------------- FAQ */

/**
 * `tone` exists because the page alternates background and surface bands, and
 * the section above the FAQ may render nothing — the testimonials band is
 * absent whenever the library is empty. Hard-coding a tone here would leave two
 * identical bands stacked. The renderer decides; this component honours it.
 */
export function Faq({
  heading,
  items,
  tone = 'background',
}: {
  heading?: string
  items?: { q: string; a: string }[]
  tone?: 'background' | 'surface'
}) {
  const faqs = (items ?? []).filter((item) => item.q?.trim())
  const [open, setOpen] = useState<number | null>(0)

  if (faqs.length === 0) return null

  return (
    <section
      className={cn(
        'py-24 md:py-32',
        tone === 'surface' ? 'bg-surface' : 'bg-background',
      )}
    >
      <Container className="max-w-4xl">
        {heading?.trim() && (
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground md:text-5xl">
              {heading}
            </h2>
          </Reveal>
        )}
        <div
          className={cn(
            heading?.trim() && 'mt-14',
            'divide-y divide-border border-y border-border',
          )}
        >
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
                  {isOpen && item.a.trim() && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 leading-relaxed text-pretty text-muted-foreground">
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

/**
 * The closing CTA.
 *
 * A genuine full-bleed band in the identity's navy — the brand system already
 * carries `--navy` as "a dark ground, not the page", and this is the one place
 * on the site that wants a dark ground. Square edges, edge-to-edge, so it reads
 * as a structural break in the page rather than a component sitting on it. The
 * copy is left-aligned against the same grid the rest of the site uses, which
 * is what makes it feel like part of the document.
 */
export function FinalCta({
  heading,
  body,
  primaryCta,
  secondaryCta,
}: {
  heading?: string
  body?: string
  primaryCta?: Cta
  secondaryCta?: Cta
}) {
  if (!heading?.trim()) return null

  return (
    <section className="relative overflow-hidden bg-navy py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-[0.07]"
        aria-hidden
      >
        <div className="grid-lines-light h-full w-full" />
      </div>
      <Container className="relative">
        <Reveal className="max-w-3xl">
          <h2 className="text-4xl font-semibold tracking-tight text-balance text-white md:text-5xl lg:text-6xl">
            {heading}
          </h2>
          {body?.trim() && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-white/70">
              {body}
            </p>
          )}
          {(hasCta(primaryCta) || hasCta(secondaryCta)) && (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {hasCta(primaryCta) && (
                <Link
                  href={primaryCta.href}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-cta px-7 py-3.5 text-[0.95rem] font-medium text-cta-foreground transition-all duration-300 hover:bg-cta-hover"
                >
                  {primaryCta.label}
                </Link>
              )}
              {hasCta(secondaryCta) && (
                <ButtonLink
                  href={secondaryCta.href}
                  variant="ghost"
                  className="px-5 py-3.5 text-white/80 hover:text-white"
                  withArrow
                >
                  {secondaryCta.label}
                </ButtonLink>
              )}
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  )
}
