import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { prisma } from '@/db/prisma'
import { Prisma } from '@/generated/prisma/client'
import { cacheTags } from '@/server/cache/tags'

import {
  toCaseStudySummary,
  toPublishedCaseStudy,
  toPublishedPage,
  toSiteSettings,
} from './mappers'
import type {
  CaseStudySummary,
  PublishedCaseStudy,
  PublishedPage,
  SiteSettingsDto,
} from './types'

/**
 * Cached public reads.
 *
 * Every function here is `'use cache'` + `cacheTag` + `cacheLife('max')`:
 * content changes only when the admin publishes, and publishing invalidates the
 * tag, so time-based revalidation would be pure churn (ARCHITECTURE.md §4.1).
 *
 * ⚠️ Nothing in this file may read `cookies()`, `headers()` or `searchParams` —
 * not even transitively. That restriction follows the call stack and is a
 * runtime error. Admin reads live in admin-queries.ts for exactly this reason.
 */

const PAGE_SELECT = {
  id: true,
  slug: true,
  title: true,
  seoTitle: true,
  seoDescription: true,
  seoImageId: true,
  seoNoIndex: true,
  publishedContent: true,
  draftContent: true,
  publishedAt: true,
} as const

const CASE_STUDY_SELECT = {
  id: true,
  slug: true,
  clientName: true,
  clientLogoId: true,
  headline: true,
  summary: true,
  industry: true,
  isFeatured: true,
  heroImageId: true,
  seoTitle: true,
  seoDescription: true,
  publishedContent: true,
  draftContent: true,
  publishedAt: true,
} as const

export async function getPublishedPage(slug: string): Promise<PublishedPage | null> {
  'use cache'
  cacheTag(cacheTags.page(slug))
  cacheLife('max')

  const page = await prisma.page.findUnique({
    where: { slug },
    select: PAGE_SELECT,
  })

  // publishedContent != null is the single source of truth for "is this live?"
  if (!page || page.publishedContent === null) return null

  return toPublishedPage(page, 'published')
}

/**
 * Published slugs, for `generateStaticParams`, the sitemap and navigation.
 * Tagged `pages:index` so any publish, unpublish or slug change refreshes it.
 */
export async function getPublishedPageSlugs(): Promise<string[]> {
  'use cache'
  cacheTag(cacheTags.pagesIndex)
  cacheLife('max')

  const pages = await prisma.page.findMany({
    where: { publishedContent: { not: Prisma.DbNull }, seoNoIndex: false },
    select: { slug: true },
    orderBy: { slug: 'asc' },
  })

  return pages.map((page) => page.slug)
}

export async function getPublishedCaseStudy(
  slug: string,
): Promise<PublishedCaseStudy | null> {
  'use cache'
  cacheTag(cacheTags.caseStudy(slug))
  cacheLife('max')

  const caseStudy = await prisma.caseStudy.findUnique({
    where: { slug },
    select: CASE_STUDY_SELECT,
  })

  if (!caseStudy || caseStudy.publishedContent === null) return null

  return toPublishedCaseStudy(caseStudy, 'published')
}

export async function getPublishedCaseStudies(
  limit?: number,
): Promise<CaseStudySummary[]> {
  'use cache'
  cacheTag(cacheTags.caseStudiesIndex)
  cacheLife('max')

  const caseStudies = await prisma.caseStudy.findMany({
    where: { publishedContent: { not: Prisma.DbNull } },
    select: {
      id: true,
      slug: true,
      clientName: true,
      headline: true,
      summary: true,
      industry: true,
      isFeatured: true,
      heroImageId: true,
      publishedContent: true,
      publishedAt: true,
    },
    orderBy: [{ isFeatured: 'desc' }, { position: 'asc' }, { publishedAt: 'desc' }],
    ...(limit ? { take: limit } : {}),
  })

  return caseStudies.map(toCaseStudySummary)
}

export async function getPublishedCaseStudySlugs(): Promise<string[]> {
  'use cache'
  cacheTag(cacheTags.caseStudiesIndex)
  cacheLife('max')

  const caseStudies = await prisma.caseStudy.findMany({
    where: { publishedContent: { not: Prisma.DbNull } },
    select: { slug: true },
    orderBy: { slug: 'asc' },
  })

  return caseStudies.map((caseStudy) => caseStudy.slug)
}

export async function getSiteSettings(): Promise<SiteSettingsDto | null> {
  'use cache'
  cacheTag(cacheTags.settings)
  cacheLife('max')

  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'singleton' },
  })

  return settings ? toSiteSettings(settings) : null
}
