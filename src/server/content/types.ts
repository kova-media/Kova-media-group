import type { CaseStudyNarrative, CaseStudyResult } from './schemas/case-study'
import type { CaseStudyMetric, PageContent } from './schemas/page'

/**
 * Domain types — what leaves `src/server/**`.
 *
 * Prisma types never cross this boundary (ADR-005). Two reasons that matter:
 * `'use cache'` rejects class instances at runtime, and explicit shapes mean we
 * never accidentally serialize a column we did not intend to expose.
 */

export type MediaAssetDto = {
  id: string
  url: string
  alt: string
  caption: string | null
  width: number | null
  height: number | null
  blurDataURL: string | null
  mimeType: string
  filename: string
  byteSize: number
  folder: string | null
  createdAt: string
}

export type TestimonialDto = {
  id: string
  quote: string
  authorName: string
  authorRole: string | null
  companyName: string
  companyLogoId: string | null
  avatarId: string | null
  caseStudyId: string | null
}

export type PartnerLogoDto = {
  id: string
  name: string
  mediaId: string
  href: string | null
}

export type EmailExampleDto = {
  id: string
  title: string
  clientName: string | null
  mediaId: string
  category: string | null
  caseStudyId: string | null
}

export type SeoFields = {
  title: string | null
  description: string | null
  imageId: string | null
  noIndex: boolean
}

export type PublishedPage = {
  id: string
  slug: string
  title: string
  seo: SeoFields
  content: PageContent
  publishedAt: string | null
  /** True when rendering a draft preview rather than published content. */
  isDraft: boolean
}

export type PublishedCaseStudy = {
  id: string
  slug: string
  clientName: string
  clientLogoId: string | null
  headline: string
  summary: string
  industry: string | null
  isFeatured: boolean
  heroImageId: string | null
  metrics: CaseStudyMetric[]
  /** The designed template's content — what the case study page renders. */
  narrative: CaseStudyNarrative
  content: PageContent
  seo: Pick<SeoFields, 'title' | 'description'>
  publishedAt: string | null
  isDraft: boolean
}

export type CaseStudySummary = {
  id: string
  slug: string
  clientName: string
  headline: string
  summary: string
  industry: string | null
  isFeatured: boolean
  heroImageId: string | null
  metrics: CaseStudyMetric[]
  results: CaseStudyResult[]
  accent: string
}

export type SiteSettingsDto = {
  siteName: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  defaultSeoImageId: string | null
  contactEmail: string
  bookingUrl: string | null
  logoId: string | null
  logoDarkId: string | null
  socialLinks: { label: string; href: string }[]
  navigation: { label: string; href: string }[]
  /** Raw JSON blobs, validated by `schemas/settings.ts` where they are read. */
  header: unknown
  footer: unknown
}

/** Admin list rows. Derived status, never stored (DATABASE.md §4.2). */
export type PageStatus = 'DRAFT' | 'LIVE' | 'LIVE_WITH_CHANGES' | 'UNPUBLISHED'

export type PageSummary = {
  id: string
  slug: string
  title: string
  isSystem: boolean
  status: PageStatus
  sectionCount: number
  publishedAt: string | null
  updatedAt: string
}

export type CaseStudyAdminSummary = {
  id: string
  slug: string
  clientName: string
  headline: string
  isFeatured: boolean
  position: number
  status: PageStatus
  publishedAt: string | null
  updatedAt: string
}
