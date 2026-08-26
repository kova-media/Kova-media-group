import 'server-only'

import { z } from 'zod'

import {
  parseStoredCaseStudyContent,
  parseStoredPageContent,
  type CaseStudyContent,
} from './schemas/page'
import type {
  CaseStudyAdminSummary,
  CaseStudySummary,
  EmailExampleDto,
  MediaAssetDto,
  PageStatus,
  PageSummary,
  PartnerLogoDto,
  PublishedCaseStudy,
  PublishedPage,
  SiteSettingsDto,
  TestimonialDto,
} from './types'

/**
 * Prisma row → plain domain object (ADR-005).
 *
 * Every cached read ends here. `'use cache'` serializes return values and
 * rejects class instances, and that failure is a *runtime* error that can pass
 * `next build` and only surface under `next start`. Dates are serialized to ISO
 * strings so the shape is stable across the server/client boundary too.
 */

/** Narrow Prisma row shapes — structural, so `select` results satisfy them. */
type MediaRow = {
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
  createdAt: Date
}

export function toMediaAsset(row: MediaRow): MediaAssetDto {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt,
    caption: row.caption,
    width: row.width,
    height: row.height,
    blurDataURL: row.blurDataURL,
    mimeType: row.mimeType,
    filename: row.filename,
    byteSize: row.byteSize,
    folder: row.folder,
    createdAt: row.createdAt.toISOString(),
  }
}

type TestimonialRow = {
  id: string
  quote: string
  authorName: string
  authorRole: string | null
  companyName: string
  companyLogoId: string | null
  avatarId: string | null
  caseStudyId: string | null
}

export function toTestimonial(row: TestimonialRow): TestimonialDto {
  return { ...row }
}

type PartnerLogoRow = { id: string; name: string; mediaId: string; href: string | null }

export function toPartnerLogo(row: PartnerLogoRow): PartnerLogoDto {
  return { ...row }
}

type EmailExampleRow = {
  id: string
  title: string
  clientName: string | null
  mediaId: string
  category: string | null
  caseStudyId: string | null
}

export function toEmailExample(row: EmailExampleRow): EmailExampleDto {
  return { ...row }
}

type PageRow = {
  id: string
  slug: string
  title: string
  seoTitle: string | null
  seoDescription: string | null
  seoImageId: string | null
  seoNoIndex: boolean
  publishedContent: unknown
  draftContent: unknown
  publishedAt: Date | null
}

export function toPublishedPage(
  row: PageRow,
  source: 'published' | 'draft',
): PublishedPage {
  const raw = source === 'draft' ? row.draftContent : row.publishedContent

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    seo: {
      title: row.seoTitle,
      description: row.seoDescription,
      imageId: row.seoImageId,
      noIndex: row.seoNoIndex,
    },
    content: parseStoredPageContent(raw, `page:${row.slug}`),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    isDraft: source === 'draft',
  }
}

type CaseStudyRow = {
  id: string
  slug: string
  clientName: string
  clientLogoId: string | null
  headline: string
  summary: string
  industry: string | null
  isFeatured: boolean
  heroImageId: string | null
  seoTitle: string | null
  seoDescription: string | null
  publishedContent: unknown
  draftContent: unknown
  publishedAt: Date | null
}

export function toPublishedCaseStudy(
  row: CaseStudyRow,
  source: 'published' | 'draft',
): PublishedCaseStudy {
  const raw = source === 'draft' ? row.draftContent : row.publishedContent
  const content: CaseStudyContent = parseStoredCaseStudyContent(
    raw,
    `case-study:${row.slug}`,
  )

  return {
    id: row.id,
    slug: row.slug,
    clientName: row.clientName,
    clientLogoId: row.clientLogoId,
    headline: row.headline,
    summary: row.summary,
    industry: row.industry,
    isFeatured: row.isFeatured,
    heroImageId: row.heroImageId,
    metrics: content.metrics,
    narrative: content.narrative,
    content: { sections: content.sections },
    seo: { title: row.seoTitle, description: row.seoDescription },
    publishedAt: row.publishedAt?.toISOString() ?? null,
    isDraft: source === 'draft',
  }
}

export function toCaseStudySummary(
  row: Omit<
    CaseStudyRow,
    'draftContent' | 'seoTitle' | 'seoDescription' | 'clientLogoId'
  >,
): CaseStudySummary {
  const content = parseStoredCaseStudyContent(
    row.publishedContent,
    `case-study:${row.slug}`,
  )

  return {
    id: row.id,
    slug: row.slug,
    clientName: row.clientName,
    headline: row.headline,
    summary: row.summary,
    industry: row.industry,
    isFeatured: row.isFeatured,
    heroImageId: row.heroImageId,
    metrics: content.metrics,
    // The index and the homepage grid both show headline results, so the
    // summary carries them rather than forcing a second read per card.
    results: content.narrative.results,
    accent: content.narrative.accent,
  }
}

/**
 * Derived liveness (DATABASE.md §4.2).
 *
 * `publishedContent != null` is the single source of truth. There is no status
 * column to fall out of sync with it.
 */
export function derivePageStatus(row: {
  publishedContent: unknown
  publishedAt: Date | null
  updatedAt: Date
}): PageStatus {
  if (row.publishedContent === null || row.publishedContent === undefined) {
    return row.publishedAt ? 'UNPUBLISHED' : 'DRAFT'
  }

  if (row.publishedAt && row.updatedAt.getTime() > row.publishedAt.getTime()) {
    return 'LIVE_WITH_CHANGES'
  }

  return 'LIVE'
}

function countSections(value: unknown): number {
  const parsed = z
    .object({ sections: z.array(z.unknown()).default([]) })
    .safeParse(value ?? {})

  return parsed.success ? parsed.data.sections.length : 0
}

export function toPageSummary(row: {
  id: string
  slug: string
  title: string
  isSystem: boolean
  draftContent: unknown
  publishedContent: unknown
  publishedAt: Date | null
  updatedAt: Date
}): PageSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    isSystem: row.isSystem,
    status: derivePageStatus(row),
    sectionCount: countSections(row.draftContent),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function toCaseStudyAdminSummary(row: {
  id: string
  slug: string
  clientName: string
  headline: string
  isFeatured: boolean
  position: number
  publishedContent: unknown
  publishedAt: Date | null
  updatedAt: Date
}): CaseStudyAdminSummary {
  return {
    id: row.id,
    slug: row.slug,
    clientName: row.clientName,
    headline: row.headline,
    isFeatured: row.isFeatured,
    position: row.position,
    status: derivePageStatus(row),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }
}

const navigationSchema = z
  .array(z.object({ label: z.string(), href: z.string() }))
  .catch([])

const socialLinksSchema = z
  .array(z.object({ label: z.string(), href: z.string() }))
  .catch([])

type SettingsRow = {
  siteName: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  defaultSeoImageId: string | null
  contactEmail: string
  bookingUrl: string | null
  logoId: string | null
  logoDarkId: string | null
  socialLinks: unknown
  navigation: unknown
  header: unknown
  footer: unknown
}

export function toSiteSettings(row: SettingsRow): SiteSettingsDto {
  return {
    siteName: row.siteName,
    defaultSeoTitle: row.defaultSeoTitle,
    defaultSeoDescription: row.defaultSeoDescription,
    defaultSeoImageId: row.defaultSeoImageId,
    contactEmail: row.contactEmail,
    bookingUrl: row.bookingUrl,
    logoId: row.logoId,
    logoDarkId: row.logoDarkId,
    socialLinks: socialLinksSchema.parse(row.socialLinks),
    navigation: navigationSchema.parse(row.navigation),
    // Passed through untouched. The chrome schemas in `schemas/settings.ts`
    // own the shape of these two blobs, and validating them twice — once here
    // with a thinner guess and once there — is how the two drift.
    header: row.header,
    footer: row.footer,
  }
}
