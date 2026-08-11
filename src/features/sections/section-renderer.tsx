import { Container, Eyebrow, Section } from '@/components/site/primitives'
import { MediaImage } from '@/components/media/media-image'
import { richTextSchema } from '@/server/content/schemas/rich-text'
import type { PageContent } from '@/server/content/schemas/page'
import type { SectionType } from '@/server/content/sections/types'
import type {
  EmailExampleDto,
  MediaAssetDto,
  PartnerLogoDto,
  TestimonialDto,
} from '@/server/content/types'

import { RichTextRenderer } from './rich-text/rich-text'

/**
 * Maps section types to components.
 *
 * **One rendering path.** Preview and production both come through here, so
 * "the preview looked different" is a class of bug designed out rather than
 * tested for (CMS.md §5).
 *
 * Unknown types render nothing instead of crashing, so a published document
 * referencing a since-removed section degrades gracefully.
 */
export type ResolvedReferences = {
  media: Map<string, MediaAssetDto>
  testimonials: Map<string, TestimonialDto>
  logos: PartnerLogoDto[]
  emailExamples: EmailExampleDto[]
}

type SectionProps = {
  data: Record<string, unknown>
  refs: ResolvedReferences
  /** True for the first section, which owns the LCP image. */
  isFirst: boolean
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const richText = (value: unknown) => {
  const parsed = richTextSchema.safeParse(value)
  return parsed.success ? parsed.data : []
}
const mediaRef = (value: unknown) =>
  value && typeof value === 'object' && 'mediaId' in value
    ? (value as { mediaId: string; altOverride?: string })
    : undefined

function formatMetric(value: number, unit: string): string {
  switch (unit) {
    case 'PERCENT':
      return `${value > 0 ? '+' : ''}${value}%`
    case 'CURRENCY_USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
    case 'MULTIPLIER':
      return `${value}×`
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}

function Hero({ data, refs, isFirst }: SectionProps) {
  const ref = mediaRef(data['media'])
  const asset = ref ? refs.media.get(ref.mediaId) : undefined
  const primary = data['primaryCta'] as { label: string; href: string } | undefined

  return (
    <Section spacing="lg" className="pt-14">
      <Container>
        {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
        <h1 className="mt-5 max-w-4xl text-4xl font-medium text-balance text-foreground sm:text-5xl lg:text-6xl">
          {str(data['headline'])}
        </h1>
        {str(data['subhead']) && (
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{str(data['subhead'])}</p>
        )}
        {primary?.href && (
          <a
            href={primary.href}
            className="duration-fast mt-9 inline-flex h-12 items-center rounded-md bg-foreground px-7 text-sm font-medium text-background transition-colors hover:bg-brand"
          >
            {primary.label}
          </a>
        )}
        {asset && (
          <div className="mt-14">
            <MediaImage
              asset={asset}
              altOverride={ref?.altOverride}
              sizes="(max-width: 1024px) 100vw, 1200px"
              priority={isFirst}
              className="w-full rounded-xl"
            />
          </div>
        )}
      </Container>
    </Section>
  )
}

function LogoStrip({ data, refs }: SectionProps) {
  if (refs.logos.length === 0) return null

  return (
    <Section spacing="sm">
      <Container>
        {str(data['caption']) && (
          <p className="mb-8 text-center text-sm text-muted-foreground">
            {str(data['caption'])}
          </p>
        )}
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {refs.logos.map((logo) => {
            const asset = refs.media.get(logo.mediaId)
            if (!asset) return null

            return (
              <li key={logo.id} className="opacity-60">
                <MediaImage
                  asset={asset}
                  altOverride={logo.name}
                  sizes="140px"
                  className="h-7 w-auto object-contain"
                />
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}

function ProofMetrics({ data }: SectionProps) {
  const metrics = Array.isArray(data['metrics'])
    ? (data['metrics'] as {
        label: string
        value: number
        unit: string
        timeframe?: string
      }[])
    : []

  return (
    <Section>
      <Container>
        {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
        {str(data['heading']) && (
          <h2 className="mt-4 max-w-2xl text-3xl font-medium text-balance text-foreground">
            {str(data['heading'])}
          </h2>
        )}
        <dl className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <div key={index}>
              <dt className="text-5xl font-medium tracking-tight text-foreground">
                {formatMetric(metric.value, metric.unit)}
              </dt>
              <dd className="mt-3 text-sm text-muted-foreground">
                {metric.label}
                {metric.timeframe && (
                  <span className="block text-muted-foreground">{metric.timeframe}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}

function Narrative({ data, refs }: SectionProps) {
  const ref = mediaRef(data['media'])
  const asset = ref ? refs.media.get(ref.mediaId) : undefined
  const position = str(data['mediaPosition']) || 'right'

  return (
    <Section>
      <Container>
        <div className={cnGrid(Boolean(asset), position as 'left' | 'right' | 'below')}>
          <div className={position === 'left' && asset ? 'lg:order-2' : undefined}>
            {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
            {str(data['heading']) && (
              <h2 className="mt-4 text-3xl font-medium text-balance text-foreground">
                {str(data['heading'])}
              </h2>
            )}
            <RichTextRenderer nodes={richText(data['body'])} className="mt-6" />
          </div>
          {asset && (
            <div className={position === 'left' ? 'lg:order-1' : undefined}>
              <MediaImage
                asset={asset}
                altOverride={ref?.altOverride}
                sizes="(max-width: 1024px) 100vw, 600px"
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}

function cnGrid(hasMedia: boolean, position: 'left' | 'right' | 'below') {
  if (!hasMedia) return 'max-w-3xl'
  if (position === 'below') return 'flex flex-col gap-12'
  return 'grid items-center gap-12 lg:grid-cols-2'
}

function OutcomeList({ data }: SectionProps) {
  const items = Array.isArray(data['outcomes'])
    ? (data['outcomes'] as { title: string; detail: string }[])
    : Array.isArray(data['points'])
      ? (data['points'] as { title: string; detail: string }[])
      : []

  return (
    <Section>
      <Container>
        {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
        <h2 className="mt-4 max-w-2xl text-3xl font-medium text-balance text-foreground">
          {str(data['heading'])}
        </h2>
        <RichTextRenderer nodes={richText(data['body'])} className="mt-6 max-w-xl" />
        {items.length > 0 && (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <li key={index}>
                <h3 className="text-base font-medium text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  )
}

function TestimonialGrid({ data, refs }: SectionProps) {
  const ids = Array.isArray(data['testimonialIds'])
    ? (data['testimonialIds'] as string[])
    : []
  const quotes = ids
    .map((id) => refs.testimonials.get(id))
    .filter((value): value is TestimonialDto => Boolean(value))

  if (quotes.length === 0) return null

  return (
    <Section>
      <Container>
        {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
        {str(data['heading']) && (
          <h2 className="mt-4 max-w-2xl text-3xl font-medium text-balance text-foreground">
            {str(data['heading'])}
          </h2>
        )}
        <ul className="mt-12 grid gap-10 lg:grid-cols-2">
          {quotes.map((quote) => (
            <li key={quote.id}>
              <figure>
                <blockquote className="text-lg text-balance text-foreground/85">
                  “{quote.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  {quote.authorName}
                  {quote.authorRole && `, ${quote.authorRole}`} · {quote.companyName}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

function TestimonialFeature({ data, refs }: SectionProps) {
  const quote = refs.testimonials.get(str(data['testimonialId']))
  if (!quote) return null

  return (
    <Section>
      <Container width="content">
        <figure className="text-center">
          <blockquote className="text-3xl font-medium text-balance text-foreground">
            “{quote.quote}”
          </blockquote>
          <figcaption className="mt-6 text-sm text-muted-foreground">
            {quote.authorName}
            {quote.authorRole && `, ${quote.authorRole}`} · {quote.companyName}
          </figcaption>
        </figure>
      </Container>
    </Section>
  )
}

function EmailGallery({ data, refs }: SectionProps) {
  if (refs.emailExamples.length === 0) return null

  return (
    <Section>
      <Container>
        {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
        {str(data['heading']) && (
          <h2 className="mt-4 max-w-2xl text-3xl font-medium text-balance text-foreground">
            {str(data['heading'])}
          </h2>
        )}
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {refs.emailExamples.map((example) => {
            const asset = refs.media.get(example.mediaId)
            if (!asset) return null

            return (
              <li key={example.id}>
                <MediaImage
                  asset={asset}
                  altOverride={`${example.title}${example.clientName ? ` for ${example.clientName}` : ''}`}
                  sizes="(max-width: 640px) 100vw, 380px"
                  className="w-full rounded-lg"
                />
                <p className="mt-3 text-sm font-medium text-foreground/80">{example.title}</p>
                {example.category && (
                  <p className="text-xs text-muted-foreground">{example.category}</p>
                )}
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}

function Faq({ data }: SectionProps) {
  const items = Array.isArray(data['items'])
    ? (data['items'] as { question: string; answer: unknown }[])
    : []

  return (
    <Section>
      <Container width="content">
        {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
        {str(data['heading']) && (
          <h2 className="mt-4 text-3xl font-medium text-balance text-foreground">
            {str(data['heading'])}
          </h2>
        )}
        <dl className="mt-10 flex flex-col">
          {items.map((item, index) => (
            <div key={index} className="border-t border-border py-6 last:border-b">
              <dt className="text-lg font-medium text-foreground">{item.question}</dt>
              <dd>
                <RichTextRenderer nodes={richText(item.answer)} className="mt-2" />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}

function Cta({ data }: SectionProps) {
  const primary = data['primaryCta'] as { label: string; href: string } | undefined

  return (
    <Section spacing="lg">
      <Container width="content" className="text-center">
        {str(data['eyebrow']) && <Eyebrow>{str(data['eyebrow'])}</Eyebrow>}
        <h2 className="mt-4 text-4xl font-medium text-balance text-foreground">
          {str(data['heading'])}
        </h2>
        {str(data['body']) && (
          <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
            {str(data['body'])}
          </p>
        )}
        {primary?.href && (
          <a
            href={primary.href}
            className="duration-fast mt-9 inline-flex h-12 items-center rounded-md bg-foreground px-7 text-sm font-medium text-background transition-colors hover:bg-brand"
          >
            {primary.label}
          </a>
        )}
      </Container>
    </Section>
  )
}

function RichTextSection({ data }: SectionProps) {
  return (
    <Section>
      <Container width="content">
        {str(data['heading']) && (
          <h2 className="mb-6 text-3xl font-medium text-foreground">
            {str(data['heading'])}
          </h2>
        )}
        <RichTextRenderer nodes={richText(data['body'])} />
      </Container>
    </Section>
  )
}

const sectionComponents: Partial<
  Record<SectionType, (props: SectionProps) => React.ReactNode>
> = {
  HERO: Hero,
  LOGO_STRIP: LogoStrip,
  PROOF_METRICS: ProofMetrics,
  NARRATIVE: Narrative,
  SERVICE_DETAIL: OutcomeList,
  PARTNERSHIP: OutcomeList,
  TESTIMONIAL_GRID: TestimonialGrid,
  TESTIMONIAL_FEATURE: TestimonialFeature,
  EMAIL_GALLERY: EmailGallery,
  FAQ: Faq,
  CTA: Cta,
  RICH_TEXT: RichTextSection,
}

export function SectionRenderer({
  content,
  refs,
}: {
  content: PageContent
  refs: ResolvedReferences
}) {
  const visible = content.sections.filter((section) => section.isEnabled)

  return (
    <>
      {visible.map((section, index) => {
        const Component = sectionComponents[section.type as SectionType]
        if (!Component) return null

        return (
          <Component
            key={section.id}
            data={(section.data ?? {}) as Record<string, unknown>}
            refs={refs}
            isFirst={index === 0}
          />
        )
      })}
    </>
  )
}
