'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import {
  fail,
  ok,
  parseInput,
  unexpected,
  type ActionResult,
} from '@/server/actions/result'
import { requireAdmin } from '@/server/auth/dal'
import { cacheTags } from '@/server/cache/tags'
import {
  createCaseStudy,
  deleteCaseStudy,
  publishCaseStudy,
  reorderCaseStudies,
  saveCaseStudyDraft,
  unpublishCaseStudy,
  updateCaseStudyFields,
} from '@/server/content/case-study-mutations'
import { DraftConflictError } from '@/server/content/mutations'
import {
  caseStudyNarrativeSchema,
  publishCaseStudyNarrativeSchema,
} from '@/server/content/schemas/case-study'

/**
 * Case study mutations.
 *
 * Every action follows the same order: authorize, validate, write, invalidate
 * (CODING_STANDARDS.md §5). A Server Action is a public HTTP endpoint, so
 * `requireAdmin()` here is the real check — not a formality duplicated from the
 * layout.
 */

const slugSchema = z
  .string()
  .trim()
  .min(1, 'A URL slug is required.')
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers and hyphens only.',
  )

/**
 * Invalidates everything a case study appears in.
 *
 * A study is shown on its own page, the index, and the homepage grid, so a
 * publish has to clear all three — invalidating only the study itself would
 * leave a stale card on the homepage with no obvious cause.
 */
function invalidate(slug: string, previousSlug?: string) {
  updateTag(cacheTags.caseStudy(slug))
  if (previousSlug && previousSlug !== slug) {
    updateTag(cacheTags.caseStudy(previousSlug))
  }
  updateTag(cacheTags.caseStudiesIndex)
  revalidatePath('/case-studies')
  revalidatePath('/')
}

export async function createCaseStudyAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(
    z.object({
      clientName: z.string().trim().min(1, 'A client name is required.').max(120),
      headline: z.string().trim().min(1, 'A headline is required.').max(200),
      slug: slugSchema,
    }),
    {
      clientName: formData.get('clientName'),
      headline: formData.get('headline'),
      slug: formData.get('slug'),
    },
  )

  if (!parsed.ok) return parsed.result

  let id: string

  try {
    const created = await createCaseStudy(parsed.data)
    id = created.id
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return fail('That URL slug is already taken.', {
        slug: ['That URL slug is already taken.'],
      })
    }
    return unexpected('createCaseStudy', error)
  }

  invalidate(parsed.data.slug)
  // Outside the try: redirect() throws by design, and catching it would turn a
  // successful create into a generic error.
  redirect(`/admin/case-studies/${id}`)
}

const detailsSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  clientName: z.string().trim().min(1, 'A client name is required.').max(120),
  headline: z.string().trim().min(1, 'A headline is required.').max(200),
  summary: z.string().trim().max(600),
  industry: z.string().trim().max(80),
  heroImageId: z.string().trim().max(64),
  clientLogoId: z.string().trim().max(64),
  isFeatured: z.coerce.boolean(),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(320),
})

export async function saveCaseStudyDetails(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(detailsSchema, {
    id: formData.get('id'),
    slug: formData.get('slug'),
    clientName: formData.get('clientName'),
    headline: formData.get('headline'),
    summary: formData.get('summary') ?? '',
    industry: formData.get('industry') ?? '',
    heroImageId: formData.get('heroImageId') ?? '',
    clientLogoId: formData.get('clientLogoId') ?? '',
    isFeatured: formData.get('isFeatured') === 'on',
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
  })

  if (!parsed.ok) return parsed.result

  const { id, ...fields } = parsed.data

  try {
    const { previousSlug, slug } = await updateCaseStudyFields(id, {
      slug: fields.slug,
      clientName: fields.clientName,
      headline: fields.headline,
      summary: fields.summary,
      industry: fields.industry || null,
      heroImageId: fields.heroImageId || null,
      clientLogoId: fields.clientLogoId || null,
      isFeatured: fields.isFeatured,
      seoTitle: fields.seoTitle || null,
      seoDescription: fields.seoDescription || null,
    })

    invalidate(slug, previousSlug)
    return ok()
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return fail('That URL slug is already taken.', {
        slug: ['That URL slug is already taken.'],
      })
    }
    return unexpected('saveCaseStudyDetails', error)
  }
}

export async function saveCaseStudyNarrative(
  input: unknown,
): Promise<ActionResult<{ version: number }>> {
  await requireAdmin()

  const parsed = parseInput(
    z.object({
      id: z.string().min(1),
      expectedVersion: z.number().int().min(0),
      narrative: caseStudyNarrativeSchema,
    }),
    input,
  )

  if (!parsed.ok) return parsed.result

  try {
    const version = await saveCaseStudyDraft(
      parsed.data.id,
      parsed.data.narrative,
      parsed.data.expectedVersion,
    )

    return ok({ version })
  } catch (error) {
    if (error instanceof DraftConflictError) {
      // Deliberately not auto-merged: silently choosing a winner loses work.
      return fail(
        'This case study was changed in another tab. Reload to see the latest version.',
      )
    }
    return unexpected('saveCaseStudyNarrative', error)
  }
}

export async function publishCaseStudyAction(
  id: string,
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireAdmin()

  try {
    // Publish-time validation: a live study must actually say something.
    const { getCaseStudyForEdit } = await import('@/server/content/case-study-queries')
    const study = await getCaseStudyForEdit(id)

    if (!study) return fail('That case study no longer exists.')

    const validated = publishCaseStudyNarrativeSchema.safeParse(study.narrative)

    if (!validated.success) {
      const issues = validated.error.issues
        .map((issue) => issue.message)
        .slice(0, 3)
        .join('; ')
      return fail(`Cannot publish — ${issues}`)
    }

    if (!study.summary.trim()) {
      return fail('Cannot publish — a summary is required.')
    }

    const { slug } = await publishCaseStudy(id, session.adminId)
    invalidate(slug)

    return ok({ slug })
  } catch (error) {
    return unexpected('publishCaseStudy', error)
  }
}

export async function unpublishCaseStudyAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin()

  try {
    const { slug } = await unpublishCaseStudy(id, session.adminId)
    invalidate(slug)
    return ok()
  } catch (error) {
    return unexpected('unpublishCaseStudy', error)
  }
}

export async function deleteCaseStudyAction(id: string): Promise<ActionResult> {
  await requireAdmin()

  let slug: string

  try {
    const deleted = await deleteCaseStudy(id)
    slug = deleted.slug
  } catch (error) {
    return unexpected('deleteCaseStudy', error)
  }

  invalidate(slug)
  redirect('/admin/case-studies')
}

export async function reorderCaseStudiesAction(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(z.array(z.string().min(1)).max(200), orderedIds)
  if (!parsed.ok) return parsed.result

  try {
    await reorderCaseStudies(parsed.data)
    updateTag(cacheTags.caseStudiesIndex)
    revalidatePath('/case-studies')
    revalidatePath('/')
    return ok()
  } catch (error) {
    return unexpected('reorderCaseStudies', error)
  }
}
