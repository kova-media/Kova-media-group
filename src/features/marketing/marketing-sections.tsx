import { PageHeader } from '@/components/site/page-header'
import { richTextSchema } from '@/server/content/schemas/rich-text'
import type { PageContent } from '@/server/content/schemas/page'
import {
  flattenRichText,
  resolveMarketingReferences,
  type MarketingPage,
  type MarketingReferences,
} from '@/server/content/marketing-content'
import { getSiteChrome } from '@/server/content/site-chrome'

import { Hero } from './home/hero'
import {
  AboutPreview,
  FeaturedCaseStudies,
  ProcessPreview,
  ServicesPreview,
} from './home/sections'
import {
  BookDetails,
  CaseStudyIndex,
  ContactIntro,
  ProcessDetail,
  ServicesClosing,
  ServicesList,
  ValuesBand,
} from './page-sections'
import { ClientMarquee, Faq, FinalCta, MetricsRow, Testimonials } from './sections'

/**
 * The one rendering path for the designed marketing pages.
 *
 * A section type names a component a designer wrote. This file is the whole of
 * the mapping between them, and it is the only place that reads raw section
 * data — everything downstream receives typed props. Preview and production
 * both come through here, so "the preview looked different" stays a class of
 * bug we design out rather than test for (CMS.md §5).
 *
 * An unknown type renders nothing rather than throwing, so a document that
 * outlives a removed section type degrades to a shorter page instead of a 500.
 */
type SectionData = Record<string, unknown>

const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
const strings = (value: unknown): string[] =>
  list<unknown>(value).filter((item): item is string => typeof item === 'string')
const cta = (value: unknown) =>
  value && typeof value === 'object'
    ? {
        label: str((value as SectionData)['label']),
        href: str((value as SectionData)['href']),
      }
    : undefined

/**
 * Bands that participate in the page's background alternation.
 *
 * Only the FAQ is variable — every other band carries the tone it was designed
 * with. The FAQ needs to know because the band above it may render nothing (the
 * testimonials band is absent whenever the library is empty), and two identical
 * grounds stacked breaks the rhythm the page is built on.
 */
const BAND_TONE: Record<string, 'surface' | 'background'> = {
  METRICS_BAND: 'background',
  SERVICES_OVERVIEW: 'surface',
  WORK_INDEX: 'background',
  PROCESS_STEPS: 'surface',
  STATEMENT: 'background',
  TESTIMONIALS: 'surface',
}

/** Whether a band will actually put something on the page. */
function willRender(
  type: string,
  data: SectionData,
  refs: MarketingReferences,
): boolean {
  switch (type) {
    case 'METRICS_BAND':
      return list<{ value?: string; label?: string }>(data['metrics']).some(
        (metric) => metric.value?.trim() && metric.label?.trim(),
      )
    case 'TESTIMONIALS':
      return refs.testimonials.length > 0
    case 'WORK_INDEX':
      return refs.caseStudies.length > 0
    case 'SERVICES_OVERVIEW':
    case 'PROCESS_STEPS':
      return Boolean(str(data['heading']).trim())
    case 'STATEMENT':
      return Boolean(str(data['statement']).trim())
    default:
      return true
  }
}

export async function MarketingSections({ page }: { page: MarketingPage }) {
  const visible = page.sections.filter((section) => section.isEnabled)
  const [refs, chrome] = await Promise.all([
    resolveMarketingReferences(visible),
    getSiteChrome(),
  ])

  // Resolved up front so the FAQ can ask what ground the band above it painted.
  let previousTone: 'surface' | 'background' = 'background'
  const tones = new Map<string, 'surface' | 'background'>()

  for (const section of visible) {
    const data = (section.data ?? {}) as SectionData
    const declared = BAND_TONE[section.type]

    if (section.type === 'FAQ') {
      const tone: 'surface' | 'background' =
        previousTone === 'surface' ? 'background' : 'surface'
      tones.set(section.id, tone)
      previousTone = tone
      continue
    }

    if (declared && willRender(section.type, data, refs)) {
      previousTone = declared
    }
  }

  return (
    <>
      {visible.map((section) => (
        <MarketingSection
          key={section.id}
          section={section}
          refs={refs}
          tone={tones.get(section.id) ?? 'background'}
          contactEmail={chrome.contactEmail}
          bookingUrl={chrome.bookingUrl}
        />
      ))}
    </>
  )
}

function MarketingSection({
  section,
  refs,
  tone,
  contactEmail,
  bookingUrl,
}: {
  section: PageContent['sections'][number]
  refs: MarketingReferences
  tone: 'surface' | 'background'
  contactEmail: string
  bookingUrl: string
}) {
  const data = (section.data ?? {}) as SectionData

  switch (section.type) {
    case 'PAGE_HEADER': {
      const title = str(data['title'])
      if (!title.trim()) return null
      return (
        <PageHeader
          eyebrow={str(data['eyebrow'])}
          title={title}
          description={str(data['description'])}
        />
      )
    }

    case 'HOME_HERO':
      return (
        <Hero
          headline={str(data['headline'])}
          subhead={str(data['subhead'])}
          primaryCta={cta(data['primaryCta'])}
          secondaryCta={cta(data['secondaryCta'])}
        />
      )

    case 'CLIENT_MARQUEE':
      return (
        <ClientMarquee
          caption={str(data['caption'])}
          clients={strings(data['clients'])}
        />
      )

    case 'METRICS_BAND':
      return (
        <MetricsRow
          heading={str(data['heading'])}
          body={str(data['body'])}
          metrics={list<{ value: string; label: string }>(data['metrics'])}
        />
      )

    case 'SERVICES_OVERVIEW':
      return (
        <ServicesPreview
          heading={str(data['heading'])}
          body={str(data['body'])}
          services={list(data['services'])}
        />
      )

    case 'WORK_INDEX':
      return (
        <FeaturedCaseStudies
          eyebrow={str(data['eyebrow'])}
          allWorkLabel={str(data['allWorkLabel'])}
          heading={str(data['heading'])}
          body={str(data['body'])}
          limit={num(data['limit'], 3)}
          studies={refs.caseStudies}
        />
      )

    case 'PROCESS_STEPS':
      return (
        <ProcessPreview
          heading={str(data['heading'])}
          body={str(data['body'])}
          steps={list(data['steps'])}
        />
      )

    case 'STATEMENT':
      return <AboutPreview statement={str(data['statement'])} cta={cta(data['cta'])} />

    case 'TESTIMONIALS':
      return <Testimonials heading={str(data['heading'])} quotes={refs.testimonials} />

    case 'FAQ': {
      const items = list<{ question?: unknown; answer?: unknown }>(data['items']).map(
        (item) => {
          const answer = richTextSchema.safeParse(item.answer)
          return {
            q: str(item.question),
            a: answer.success ? flattenRichText(answer.data) : '',
          }
        },
      )
      return <Faq heading={str(data['heading'])} items={items} tone={tone} />
    }

    case 'FINAL_CTA':
      return (
        <FinalCta
          heading={str(data['heading'])}
          body={str(data['body'])}
          primaryCta={cta(data['primaryCta'])}
          secondaryCta={cta(data['secondaryCta'])}
        />
      )

    case 'VALUES':
      return (
        <ValuesBand
          eyebrow={str(data['eyebrow'])}
          statement={str(data['statement'])}
          items={list(data['items'])}
        />
      )

    case 'SERVICES_LIST':
      return (
        <ServicesList
          includesLabel={str(data['includesLabel'])}
          services={list(data['services'])}
        />
      )

    case 'SERVICES_CLOSING':
      return (
        <ServicesClosing
          label={str(data['label'])}
          statement={str(data['statement'])}
          body={str(data['body'])}
        />
      )

    case 'PROCESS_DETAIL':
      return (
        <ProcessDetail
          steps={list(data['steps'])}
          asideEyebrow={str(data['asideEyebrow'])}
          asideBody={str(data['asideBody'])}
        />
      )

    case 'CASE_STUDY_LIST':
      return <CaseStudyIndex studies={refs.caseStudies} />

    case 'CONTACT_INTRO':
      return (
        <ContactIntro
          eyebrow={str(data['eyebrow'])}
          headline={str(data['headline'])}
          body={str(data['body'])}
          points={strings(data['points'])}
          responseNote={str(data['responseNote'])}
          contactEmail={contactEmail}
        />
      )

    case 'BOOK_DETAILS':
      return (
        <BookDetails
          points={strings(data['points'])}
          writeFirstLabel={str(data['writeFirstLabel'])}
          contactEmail={contactEmail}
          bookingUrl={bookingUrl}
        />
      )

    default:
      // A utility section placed on a designed page, or a type this build no
      // longer knows. Nothing to draw; the page is simply shorter.
      return null
  }
}
