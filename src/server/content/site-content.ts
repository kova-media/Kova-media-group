import 'server-only'

import {
  caseStudies as fallbackCaseStudies,
  testimonials as fallbackTestimonials,
  type CaseStudy as CaseStudyView,
} from '@/lib/site-data'

import { getPublishedCaseStudies, getPublishedCaseStudy } from './queries'
import { getAllTestimonials } from './resolvers'
import { DEFAULT_CASE_STUDY_ACCENT } from './schemas/case-study'

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
 */
export type { CaseStudyView }

export type TestimonialView = {
  quote: string
  name: string
  role: string
}

/**
 * Published case studies, newest and featured first.
 *
 * Falls back to the bundled studies when nothing is published yet.
 */
export async function getCaseStudyList(): Promise<CaseStudyView[]> {
  const published = await getPublishedCaseStudies()

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

export async function getCaseStudyDetail(slug: string): Promise<CaseStudyView | null> {
  const study = await getPublishedCaseStudy(slug)

  if (!study) {
    return fallbackCaseStudies.find((candidate) => candidate.slug === slug) ?? null
  }

  const { narrative } = study

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
    accent: narrative.accent || DEFAULT_CASE_STUDY_ACCENT,
  }
}

/** Slugs for `generateStaticParams`. */
export async function getCaseStudySlugs(): Promise<string[]> {
  const studies = await getCaseStudyList()
  return studies.map((study) => study.slug)
}

export async function getTestimonialList(): Promise<TestimonialView[]> {
  const published = await getAllTestimonials()

  if (published.length === 0) return fallbackTestimonials

  return published.map((quote) => ({
    quote: quote.quote,
    name: quote.authorName,
    // The library models role and company separately; the design shows one
    // supporting line, so they are joined rather than dropped.
    role: [quote.authorRole, quote.companyName].filter(Boolean).join(', '),
  }))
}
