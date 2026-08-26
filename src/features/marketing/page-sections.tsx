'use client'

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

          {/* A single ruled column: full measure, readable, with the vertical
              rhythm doing the separating. As four bordered tiles in a 2×2 this
              was the bento shape, and at that size the body copy sat at
              `text-sm` inside a box — the small-and-faint problem too. */}
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

/**
 * Certification badges, as a credential line rather than a logo wall.
 *
 * A row of marks under a hairline, set at reading size beside a quiet label —
 * the same move the footer column headings use. The temptation with badges is
 * to make them a band of their own with a heading and a grid, which is the
 * "trusted by" logo wall DESIGN.md rejects and which also overstates them:
 * these are credentials, and credentials belong in small type near the bottom
 * of an argument, not shouted at the top of one.
 *
 * Official artwork is rendered as supplied. Badges carry brand rules about
 * colour and clear space, so there is no filter, no tint and no hover
 * treatment — only a height cap, which every badge programme permits.
 *
 * Renders nothing until artwork exists. That is not just graceful degradation:
 * a partner badge is a claim about a current commercial relationship, and the
 * site must not make it before someone has put the real asset in the library.
 */
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

/**
 * Each service gets a full row rather than a card in a grid.
 *
 * An earlier version listed ten capabilities as equal tiles, which read as a
 * feature list and made the offer look diffuse. A band each — number, icon,
 * description, and what it includes — communicates more with less, and leaves
 * room for the copy to actually explain the work.
 *
 * The icons cycle by position and are not editable: they are a visual device,
 * and an icon picker in the admin is a design control wearing a content hat.
 */
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

  /* `pb-20` rather than the page's usual `pb-24 sm:pb-32`: the closing
     statement below this band opened with `mt-20` when the two lived in one
     section, and splitting them into separately editable sections must not
     change the gap between them. The closing band carries the page's bottom
     padding. */
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
                  {/* The numeral is plain and the icon is unboxed. A tinted
                      rounded chip behind a 20px glyph is depth for its own
                      sake — the icon reads perfectly well on the page. */}
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

/**
 * The closing statement. Boxed in a tinted rounded panel this made the most
 * important paragraph on the page look like an aside. It is set on the page
 * under a teal rule, at a size that says it matters.
 */
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
                  {/* The numeral sits bare in its own column against the rule
                      that divides the steps. Numbers are plain — `2`, not `02`
                      — and derived from position, so reordering in the admin
                      never leaves a step misnumbered. */}
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

/**
 * Studies are rows on a ruled index, not stacked cards, and the figures are set
 * in the site's own ink and teal rather than in a per-brand accent. Three
 * studies previously introduced a blue, an orange and a green for no reason
 * other than making the cards look different from one another.
 */
export function CaseStudyIndex({ studies }: { studies?: CaseStudy[] }) {
  const items = studies ?? []

  if (items.length === 0) return null

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <RevealGroup className="flex flex-col">
          {items.map((study, i) => (
            <RevealItem key={study.slug}>
              <Link
                href={`/case-studies/${study.slug}`}
                className="group grid gap-x-12 gap-y-8 border-t border-border py-12 transition-colors duration-300 last:border-b hover:border-foreground/25 sm:py-16 lg:grid-cols-[1fr_auto]"
              >
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 text-[0.8125rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                    <span className="font-mono tabular-nums">{i + 1}</span>
                    {study.category && (
                      <>
                        <span className="h-3 w-px bg-border-strong" aria-hidden />
                        <span>{study.category}</span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-4 flex items-center gap-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    {study.brand}
                    <ArrowUpRight
                      className="h-7 w-7 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand"
                      aria-hidden
                    />
                  </h2>
                  {study.summary && (
                    <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
                      {study.summary}
                    </p>
                  )}
                </div>

                {/* The figures column appears only for studies that have
                    verified figures. An empty rule beside a study with none
                    would be an invitation to fill it. */}
                {study.results.length > 0 && (
                  <div className="flex gap-x-12 gap-y-6 lg:justify-end lg:pt-1">
                    {study.results.slice(0, 2).map((result) => (
                      <div key={result.label} className="border-t-2 border-brand pt-4">
                        <div className="text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl">
                          {result.value}
                        </div>
                        <div className="mt-2 max-w-[10rem] text-[0.875rem] leading-snug text-muted-foreground">
                          {result.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------- Contact */

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
    <section className="pb-24 sm:pb-32">
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
