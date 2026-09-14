import Link from 'next/link'
import { ArrowUpRight, Check, Clock, Mail, MessageSquare } from 'lucide-react'
import { Container, Eyebrow } from '@/components/site/ui'
import { Reveal, RevealGroup, RevealItem, RevealLines } from '@/components/site/reveal'
import { FlowDiagram } from '@/components/site/mockups'
import { MediaImage, type ImageAsset } from '@/components/media/media-image'
import { BookingEmbed } from '@/features/marketing/booking-embed'
import { ContactForm } from '@/features/marketing/contact-form/contact-form'
import { RichTextRenderer } from '@/features/sections/rich-text/rich-text'
import type { RichText } from '@/server/content/schemas/rich-text'
import type { CaseStudy } from '@/lib/site-data'

import type { Flow, ProcessStep } from './home/sections'

/**
 * The interior-page bands — About, Services, Process, Case studies, Contact,
 * Book.
 *
 * These were previously written inline in their route files, which is what made
 * every word on those pages a code change. The markup is unchanged; what moved
 * is where the words come from. Each band renders only what it has been given
 * and omits the rest, so an editor clearing an optional field gets a shorter
 * page rather than a labelled hole.
 */

/* --------------------------------------------------------------------- Prose */

/**
 * Long-form prose — the privacy policy, the terms.
 *
 * These pages used to render through a separate, older component set that put
 * them in a different container at a different measure, so they read as a
 * different website. This is the same band every other interior page uses:
 * the site's own container, the reading measure the rest of the site sets for
 * body copy, and the vertical rhythm that follows a page masthead.
 *
 * No card, no eyebrow, no rule — legal prose is a document, and wrapping it in
 * furniture would be decoration standing in for hierarchy. The rich-text
 * renderer already owns the type scale for headings, lists and quotes.
 */

export function ProseBand({ heading, body }: { heading?: string; body?: RichText }) {
  const nodes = body ?? []

  if (nodes.length === 0 && !heading?.trim()) return null

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <Reveal className="max-w-2xl">
          {heading?.trim() && (
            <h2 className="mb-6 text-2xl font-medium tracking-tight text-foreground">
              {heading}
            </h2>
          )}
          <RichTextRenderer nodes={nodes} className="leading-relaxed" />
        </Reveal>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------------- Values */

export function ValuesBand({
  eyebrow,
  statement,
  items,
}: {
  eyebrow?: string
  statement?: string
  items?: { title: string; body?: string }[]
}) {
  const values = (items ?? []).filter((item) => item.title?.trim())

  if (!statement?.trim() && values.length === 0) return null

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            {eyebrow?.trim() && <Eyebrow>{eyebrow}</Eyebrow>}
            {statement?.trim() && (
              <p className="mt-7 text-2xl leading-[1.35] font-medium tracking-tight text-balance text-foreground sm:text-3xl">
                {statement}
              </p>
            )}
          </Reveal>

          <RevealGroup className="flex flex-col">
            {values.map((value, index) => (
              <RevealItem key={`${value.title}-${index}`}>
                <div className="grid gap-x-10 gap-y-3 border-t border-border py-8 last:border-b sm:grid-cols-[13rem_1fr]">
                  <h3 className="text-lg font-medium tracking-tight text-balance text-foreground">
                    {value.title}
                  </h3>
                  {value.body?.trim() && (
                    <p className="max-w-xl leading-relaxed text-pretty text-muted-foreground">
                      {value.body}
                    </p>
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------ Partner badges */

export type PartnerBadge = {
  asset: ImageAsset | undefined
  name: string
  href: string
}

export function PartnerBadges({
  label,
  badges,
}: {
  label?: string
  badges?: PartnerBadge[]
}) {
  const shown = (badges ?? []).filter((badge) => badge.asset)

  if (shown.length === 0) return null

  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="grid gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-[13rem_1fr]">
          {label?.trim() ? (
            <h2 className="text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase">
              {label}
            </h2>
          ) : (
            <span />
          )}

          <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
            {shown.map((badge, index) => {
              const image = (
                <MediaImage
                  asset={badge.asset}
                  altOverride={badge.name}
                  sizes="200px"
                  className="h-10 w-auto object-contain"
                />
              )

              return (
                <li key={`${badge.name}-${index}`}>
                  {badge.href.trim() ? (
                    <a
                      href={badge.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block transition-opacity duration-300 hover:opacity-80"
                    >
                      {image}
                    </a>
                  ) : (
                    image
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------- Services in full */

export type DetailedService = {
  title: string
  summary?: string
  description?: string
  points?: string[]
}

const SERVICE_ICONS = [Mail, MessageSquare]

export function ServicesList({
  includesLabel,
  services,
}: {
  includesLabel?: string
  services?: DetailedService[]
}) {
  const items = (services ?? []).filter((service) => service.title?.trim())

  if (items.length === 0) return null

  return (
    <section className="pb-20">
      <Container>
        <div className="flex flex-col">
          {items.map((service, index) => {
            const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length] ?? Mail
            const points = (service.points ?? []).filter(Boolean)

            return (
              <Reveal key={`${service.title}-${index}`}>
                <article className="grid gap-8 border-b border-border py-14 last:border-0 md:grid-cols-[3.5rem_1fr_20rem] md:gap-12 md:py-20">
                  <div className="flex items-center gap-5 md:flex-col md:items-start md:gap-7">
                    <span className="font-mono text-sm text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <Icon className="h-6 w-6 shrink-0 text-brand" aria-hidden />
                  </div>

                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground md:text-4xl">
                      {service.title}
                    </h2>
                    {service.summary?.trim() && (
                      <p className="mt-4 max-w-xl text-lg leading-relaxed text-pretty text-foreground/85">
                        {service.summary}
                      </p>
                    )}
                    {service.description?.trim() && (
                      <p className="mt-5 max-w-xl leading-relaxed text-pretty text-muted-foreground">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {points.length > 0 && (
                    <div className="md:pt-3">
                      {includesLabel?.trim() && (
                        <h3 className="text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase">
                          {includesLabel}
                        </h3>
                      )}
                      <ul className="mt-5 flex flex-col gap-3">
                        {points.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80"
                          >
                            <span
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand"
                              aria-hidden
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

export function ServicesClosing({
  label,
  statement,
  body,
}: {
  label?: string
  statement?: string
  body?: string
}) {
  if (!statement?.trim() && !body?.trim()) return null

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <Reveal>
          <div className="grid gap-x-12 gap-y-8 border-t-2 border-brand pt-10 md:grid-cols-[3.5rem_1fr]">
            {label?.trim() ? (
              <span className="text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase md:pt-2">
                {label}
              </span>
            ) : (
              <span />
            )}
            <div>
              {statement?.trim() && (
                <p className="max-w-3xl text-2xl leading-[1.4] font-medium tracking-tight text-balance text-foreground sm:text-3xl">
                  {statement}
                </p>
              )}
              {body?.trim() && (
                <p className="mt-7 max-w-2xl leading-relaxed text-pretty text-muted-foreground">
                  {body}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------- Process in full */

export function ProcessDetail({
  steps,
  asideEyebrow,
  asideBody,
  flow,
}: {
  steps?: ProcessStep[]
  asideEyebrow?: string
  asideBody?: string
  flow?: Flow
}) {
  const items = (steps ?? []).filter((step) => step.title?.trim())

  if (items.length === 0) return null

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <div className="grid gap-16 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <div>
            <RevealGroup className="flex flex-col">
              {items.map((item, index) => (
                <RevealItem key={`${item.title}-${index}`}>
                  <div className="grid grid-cols-[3rem_1fr] gap-x-6 border-t border-border py-9 last:border-b">
                    <span className="font-mono text-sm text-brand tabular-nums">
                      {index + 1}
                    </span>
                    <div>
                      <h2 className="text-2xl font-medium tracking-tight text-foreground">
                        {item.title}
                      </h2>
                      {item.description?.trim() && (
                        <p className="mt-3 max-w-xl leading-relaxed text-pretty text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              {asideEyebrow?.trim() && <Eyebrow>{asideEyebrow}</Eyebrow>}
              {asideBody?.trim() && (
                <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
                  {asideBody}
                </p>
              )}
              <div className="mt-8">
                <FlowDiagram title={flow?.title} steps={flow?.steps} />
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------- Case study index */

export function CaseStudyIndex({ studies }: { studies?: CaseStudy[] }) {
  const items = studies ?? []

  if (items.length === 0) return null

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <div className="flex flex-col border-t border-border">
          {items.map((study) => (
            <Link
              key={study.slug}
              href={`/work/${study.slug}`}
              className="group grid gap-4 border-b border-border py-8 md:grid-cols-[1fr_13rem_2rem] md:items-center md:gap-10"
            >
              <div>
                <h2 className="text-xl font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {study.name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {study.summary}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">{study.industry}</div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* --------------------------------------------------------------- Contact */

export function ContactIntro({
  eyebrow,
  headline,
  body,
  points,
  responseNote,
  submitLabel,
  successHeading,
  successBody,
  contactEmail,
}: {
  eyebrow?: string
  headline?: string
  body?: string
  points?: string[]
  responseNote?: string
  submitLabel?: string
  successHeading?: string
  successBody?: string
  contactEmail: string
}) {
  const lines = (headline ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const bullets = (points ?? []).filter(Boolean)

  return (
    <section className="pt-32 pb-24 sm:pt-40 sm:pb-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            {eyebrow?.trim() && <Eyebrow>{eyebrow}</Eyebrow>}
            {lines.length > 0 && (
              <h1 className="mt-6 text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl">
                <RevealLines lines={lines} />
              </h1>
            )}
            {body?.trim() && (
              <Reveal delay={0.2}>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">
                  {body}
                </p>
              </Reveal>
            )}

            {bullets.length > 0 && (
              <Reveal delay={0.3}>
                <ul className="mt-8 flex flex-col gap-3">
                  {bullets.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal delay={0.4}>
              <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8">
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-3 text-sm text-foreground transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {contactEmail}
                </a>
                {responseNote?.trim() && (
                  <span className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {responseNote}
                  </span>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <ContactForm
              submitLabel={submitLabel}
              successHeading={successHeading}
              successBody={successBody}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------------------- Book */

/**
 * Deliberately sparse. Someone who has clicked "Book a strategy call" has
 * already decided; the job of this page is to get out of the way and show a
 * calendar. The points exist to set expectations for the call, not to sell
 * again. The scheduler URL itself lives in Site settings.
 */
export function BookDetails({
  points,
  writeFirstLabel,
  calendarTitle,
  notLoadingLabel,
  openInTabLabel,
  contactEmail,
  bookingUrl,
}: {
  points?: string[]
  writeFirstLabel?: string
  calendarTitle?: string
  notLoadingLabel?: string
  openInTabLabel?: string
  contactEmail: string
  bookingUrl: string
}) {
  const bullets = (points ?? []).filter(Boolean)

  return (
    <section className="pt-16 pb-24 sm:pt-20 sm:pb-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
          <Reveal>
            {bullets.length > 0 && (
              <ul className="flex flex-col gap-4">
                {bullets.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/85">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div
              className={
                bullets.length > 0 ? 'mt-8 border-t border-border pt-8' : undefined
              }
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {writeFirstLabel?.trim() ? `${writeFirstLabel} ` : ''}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  {contactEmail}
                </a>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <BookingEmbed
              url={bookingUrl}
              title={calendarTitle}
              notLoadingLabel={notLoadingLabel}
              openInTabLabel={openInTabLabel}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
