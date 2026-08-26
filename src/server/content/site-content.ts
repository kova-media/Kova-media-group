import 'server-only'

import { logger } from '@/lib/logger'
import {
  caseStudies as fallbackCaseStudies,
  type CaseStudy as CaseStudyView,
} from '@/lib/site-data'

import { getDraftCaseStudy } from './admin-queries'
import { getPublishedCaseStudies, getPublishedCaseStudy } from './queries'
import { getAllTestimonials, getMediaAssets } from './resolvers'
import {
  DEFAULT_CASE_STUDY_ACCENT,
  DEFAULT_CASE_STUDY_LABELS,
  type CaseStudyBlock,
  type CaseStudyCta,
  type CaseStudyLabels,
} from './schemas/case-study'
import type { MediaAssetDto } from './types'

/**
 * The bridge between the CMS and the designed frontend.
 *
 * Every function here returns the **same shape the v0 components already
 * expect**, so the design layer never learns that a database exists. The CMS
 * fills those shapes; it does not get to change them.
 *
 * **Fallback to `site-data.ts` is deliberate.** An empty table means a fresh
 * clone, a new preview environment, or a migration that has not been seeded —
 * none of which should produce a site with an empty work section. The static
 * content is the floor, the database is the override.
 *
 * That floor holds for an *unreachable* database too, not only an empty one.
 * A build with no `DATABASE_URL` — the CI job that holds no secrets — otherwise
 * dies collecting page data, and an outage mid-deploy takes the whole site with
 * it. The read is logged at error level when it fails, so a genuinely
 * misconfigured production build is loud rather than quietly serving the
 * bundled copy for ever.
 */
export type { CaseStudyView }

/**
 * Runs a database read, degrading to `fallback` if it throws.
 *
 * Deliberately not silent: the failure is logged at error level so this can
 * never quietly mask a misconfigured connection.
 */
async function read<T>(query: () => Promise<T>, fallback: T, what: string): Promise<T> {
  try {
    return await query()
  } catch (error) {
    logger.error(`Could not read ${what}; falling back to bundled content`, { error })
    return fallback
  }
}

export type TestimonialView = {
  quote: string
  name: string
  role: string
}

/**
 * A case study detail page, fully resolved.
 *
 * `CaseStudyView` is the bundled shape and stays as it is — it is what the
 * index and homepage rows read. The detail page needs more: the editable block
 * headings, any extra blocks, the hero image and the per-study closing CTA.
 */
export type CaseStudyDetailView = CaseStudyView & {
  labels: Required<CaseStudyLabels>
  blocks: CaseStudyBlock[]
  cta: CaseStudyCta
  heroImage: MediaAssetDto | null
}

/** A blank label falls back to the designed default rather than disappearing. */
function resolveLabels(labels: Partial<CaseStudyLabels> | undefined) {
  const resolved = { ...DEFAULT_CASE_STUDY_LABELS }
  for (const key of Object.keys(resolved) as (keyof CaseStudyLabels)[]) {
    const value = labels?.[key]?.trim()
    if (value) resolved[key] = value
  }
  return resolved
}

/**
 * Published case studies, newest and featured first.
 *
 * Falls back to the bundled studies when nothing is published yet.
 */
export async function getCaseStudyList(): Promise<CaseStudyView[]> {
  const published = await read(() => getPublishedCaseStudies(), [], 'case study list')

  if (published.length === 0) return fallbackCaseStudies

  return published.map((study) => ({
    slug: study.slug,
    brand: study.clientName,
    category: study.industry ?? '',
    summary: study.summary,
    // The list view renders only these; the narrative fields are read on the
    // detail page, where the full document is fetched.
    background: '',
    challenge: '',
    strategy: [],
    design: '',
    automation: '',
    sms: '',
    results: study.results,
    accent: study.accent || DEFAULT_CASE_STUDY_ACCENT,
  }))
}

export async function getCaseStudyDetail(
  slug: string,
  options: { draft?: boolean } = {},
): Promise<CaseStudyDetailView | null> {
  // Draft Mode reads the unpublished document and bypasses every cache scope
  // for the request, so the admin's Preview shows exactly what Publish would.
  const study = await read(
    () => (options.draft ? getDraftCaseStudy(slug) : getPublishedCaseStudy(slug)),
    null,
    `case study "${slug}"`,
  )

  if (!study) {
    const bundled = fallbackCaseStudies.find((candidate) => candidate.slug === slug)
    if (!bundled) return null

    return {
      ...bundled,
      labels: resolveLabels(undefined),
      blocks: [],
      cta: {
        heading: '',
        body: '',
        primaryLabel: '',
        primaryHref: '',
        secondaryLabel: '',
        secondaryHref: '',
      },
      heroImage: null,
    }
  }

  const { narrative } = study

  // One id at most, and only when the study actually has an image — the
  // resolver is separately cached and tagged, so this costs nothing warm.
  const media = study.heroImageId
    ? await getMediaAssets([study.heroImageId])
    : new Map<string, MediaAssetDto>()

  return {
    slug: study.slug,
    brand: study.clientName,
    category: study.industry ?? '',
    summary: study.summary,
    background: narrative.background,
    challenge: narrative.challenge,
    strategy: narrative.strategy,
    design: narrative.design,
    automation: narrative.automation,
    sms: narrative.sms,
    results: narrative.results,
    resultsPeriod: narrative.resultsPeriod,
    accent: narrative.accent || DEFAULT_CASE_STUDY_ACCENT,
    labels: resolveLabels(narrative.labels),
    blocks: (narrative.blocks ?? []).filter(
      (block) => block.label.trim() && block.body.trim(),
    ),
    cta: narrative.cta,
    heroImage: study.heroImageId ? (media.get(study.heroImageId) ?? null) : null,
  }
}

/** Slugs for `generateStaticParams`. */
export async function getCaseStudySlugs(): Promise<string[]> {
  const studies = await getCaseStudyList()
  return studies.map((study) => study.slug)
}

/**
 * Published testimonials.
 *
 * **No fallback, deliberately.** Unlike case studies — where the bundled set is
 * real content the site can render before the database is seeded — there is no
 * safe default for a testimonial. An empty list means the section does not
 * render, which is the correct outcome.
 */
export async function getTestimonialList(): Promise<TestimonialView[]> {
  const published = await read(() => getAllTestimonials(), [], 'testimonials')

  return published.map((quote) => ({
    quote: quote.quote,
    name: quote.authorName,
    // The library models role and company separately; the design shows one
    // supporting line, so they are joined rather than dropped.
    role: [quote.authorRole, quote.companyName].filter(Boolean).join(', '),
  }))
}
