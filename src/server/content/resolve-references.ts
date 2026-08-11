import 'server-only'

import { getPublishedCaseStudies } from './queries'
import type { PageContent } from './schemas/page'
import {
  getEmailExamples,
  getMediaAssets,
  getPartnerLogos,
  getTestimonials,
} from './resolvers'
import type {
  CaseStudySummary,
  EmailExampleDto,
  MediaAssetDto,
  PartnerLogoDto,
  TestimonialDto,
} from './types'

/**
 * Turns the ids in a content document into the objects the renderer needs.
 *
 * Each resolver is separately cached and tagged (ADR-012), so this is cheap on
 * a warm cache and precise on invalidation: editing a single testimonial does
 * not disturb anything else.
 */
export type ResolvedReferences = {
  media: Map<string, MediaAssetDto>
  testimonials: Map<string, TestimonialDto>
  logos: PartnerLogoDto[]
  emailExamples: EmailExampleDto[]
  /**
   * Every published case study, keyed by id, plus the same list in display
   * order. Sections pick from it rather than each performing their own read:
   * the whole set is one cached, index-tagged query, and the volume here is a
   * handful of rows.
   */
  caseStudies: Map<string, CaseStudySummary>
  caseStudyOrder: CaseStudySummary[]
}

type Collected = {
  mediaIds: string[]
  testimonialIds: string[]
  logoIds: string[]
  emailExampleIds: string[]
  needsLogos: boolean
  needsEmailExamples: boolean
  needsCaseStudies: boolean
}

function collect(content: PageContent): Collected {
  const mediaIds = new Set<string>()
  const testimonialIds = new Set<string>()
  const logoIds = new Set<string>()
  const emailExampleIds = new Set<string>()
  let needsLogos = false
  let needsEmailExamples = false
  let needsCaseStudies = false

  const walkForMedia = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(walkForMedia)
      return
    }
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'mediaId' && typeof nested === 'string' && nested)
        mediaIds.add(nested)
      else walkForMedia(nested)
    }
  }

  for (const section of content.sections) {
    if (!section.isEnabled) continue

    const data = (section.data ?? {}) as Record<string, unknown>
    walkForMedia(data)

    if (
      section.type === 'TESTIMONIAL_FEATURE' &&
      typeof data['testimonialId'] === 'string'
    ) {
      if (data['testimonialId']) testimonialIds.add(data['testimonialId'])
    }

    if (section.type === 'TESTIMONIAL_GRID' && Array.isArray(data['testimonialIds'])) {
      for (const id of data['testimonialIds'] as string[]) {
        if (id) testimonialIds.add(id)
      }
    }

    if (section.type === 'LOGO_STRIP') {
      needsLogos = true
      if (Array.isArray(data['logoIds'])) {
        for (const id of data['logoIds'] as string[]) {
          if (id) logoIds.add(id)
        }
      }
    }

    if (section.type === 'CASE_STUDY_FEATURE' || section.type === 'CASE_STUDY_GRID') {
      needsCaseStudies = true
    }

    if (section.type === 'EMAIL_GALLERY') {
      needsEmailExamples = true
      if (Array.isArray(data['exampleIds'])) {
        for (const id of data['exampleIds'] as string[]) {
          if (id) emailExampleIds.add(id)
        }
      }
    }
  }

  return {
    mediaIds: [...mediaIds],
    testimonialIds: [...testimonialIds],
    logoIds: [...logoIds],
    emailExampleIds: [...emailExampleIds],
    needsLogos,
    needsEmailExamples,
    needsCaseStudies,
  }
}

export async function resolveReferences(
  content: PageContent,
): Promise<ResolvedReferences> {
  const wanted = collect(content)

  const [testimonials, logos, emailExamples, caseStudies] = await Promise.all([
    getTestimonials(wanted.testimonialIds),
    wanted.needsLogos ? getPartnerLogos(wanted.logoIds) : Promise.resolve([]),
    wanted.needsEmailExamples
      ? getEmailExamples(wanted.emailExampleIds)
      : Promise.resolve([]),
    wanted.needsCaseStudies ? getPublishedCaseStudies() : Promise.resolve([]),
  ])

  // Logos, email examples and case studies carry their own media, resolved in a
  // second pass now that we know which ones were selected.
  const allMediaIds = [
    ...wanted.mediaIds,
    ...logos.map((logo) => logo.mediaId),
    ...emailExamples.map((example) => example.mediaId),
    ...caseStudies
      .map((study) => study.heroImageId)
      .filter((id): id is string => Boolean(id)),
  ]

  const media = await getMediaAssets(allMediaIds)

  return {
    media,
    testimonials: new Map(testimonials.map((entry) => [entry.id, entry])),
    logos,
    emailExamples,
    caseStudies: new Map(caseStudies.map((study) => [study.id, study])),
    caseStudyOrder: caseStudies,
  }
}
