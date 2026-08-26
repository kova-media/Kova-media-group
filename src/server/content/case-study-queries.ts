import 'server-only'

import { prisma } from '@/db/prisma'
import { requireAdmin } from '@/server/auth/dal'

import { hasUnpublishedChanges } from './mappers'
import { parseStoredNarrative, type CaseStudyNarrative } from './schemas/case-study'

/**
 * Admin case study reads. **Never cached** — these call `requireAdmin()`, which
 * reads cookies, and reading request state inside a `'use cache'` scope is a
 * runtime error (FOLDER_STRUCTURE.md §5).
 */
export type CaseStudyForEdit = {
  id: string
  slug: string
  clientName: string
  headline: string
  summary: string
  industry: string
  heroImageId: string | null
  clientLogoId: string | null
  isFeatured: boolean
  position: number
  seoTitle: string
  seoDescription: string
  draftVersion: number
  narrative: CaseStudyNarrative
  isLive: boolean
  hasUnpublishedChanges: boolean
  publishedAt: string | null
}

export async function getCaseStudyForEdit(
  id: string,
): Promise<CaseStudyForEdit | null> {
  await requireAdmin()

  const study = await prisma.caseStudy.findUnique({ where: { id } })
  if (!study) return null

  const draft = (study.draftContent ?? {}) as { narrative?: unknown }

  return {
    id: study.id,
    slug: study.slug,
    clientName: study.clientName,
    headline: study.headline,
    summary: study.summary,
    industry: study.industry ?? '',
    heroImageId: study.heroImageId,
    clientLogoId: study.clientLogoId,
    isFeatured: study.isFeatured,
    position: study.position,
    seoTitle: study.seoTitle ?? '',
    seoDescription: study.seoDescription ?? '',
    draftVersion: study.draftVersion,
    narrative: parseStoredNarrative(draft.narrative),
    isLive: study.publishedContent !== null,
    hasUnpublishedChanges: hasUnpublishedChanges(
      study.draftContent,
      study.publishedContent,
    ),
    publishedAt: study.publishedAt?.toISOString() ?? null,
  }
}
