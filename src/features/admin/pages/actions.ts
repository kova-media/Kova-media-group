'use server'

import { randomUUID } from 'node:crypto'
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
import { getPageForEdit } from '@/server/content/admin-queries'
import {
  DraftConflictError,
  createPage,
  deletePage,
  publishPageContent,
  saveDraftContent,
  unpublishPageContent,
  updatePageSettings,
} from '@/server/content/mutations'
import { describeIssues, validateForPublish } from '@/server/content/publish'
import {
  createSection,
  pageContentSchema,
  type PageContent,
} from '@/server/content/schemas/page'
import { sectionRegistry } from '@/server/content/sections/registry'
import { sectionTypeSchema } from '@/server/content/sections/types'

/**
 * Page editor mutations.
 *
 * Every action follows the same order: authorize, validate, write, invalidate
 * (CODING_STANDARDS.md §5). A Server Action is a public HTTP endpoint, so
 * `requireAdmin()` here is the real check — not a formality duplicated from the
 * layout.
 */

const saveDraftSchema = z.object({
  pageId: z.string().min(1),
  expectedVersion: z.number().int().min(0),
  content: pageContentSchema,
})

export type SaveDraftResult = { version: number }

export async function saveDraft(
  input: unknown,
): Promise<ActionResult<SaveDraftResult>> {
  await requireAdmin()

  const parsed = parseInput(saveDraftSchema, input)
  if (!parsed.ok) return parsed.result

  try {
    const version = await saveDraftContent(
      parsed.data.pageId,
      // The schema validated each section against its registered type, so the
      // narrowing here is sound; Zod's inferred output keeps `type` as string.
      { sections: parsed.data.content.sections as PageContent['sections'] },
      parsed.data.expectedVersion,
    )

    return ok({ version })
  } catch (error) {
    if (error instanceof DraftConflictError) {
      // Deliberately not auto-merged: silently choosing a winner loses work.
      return fail(
        'This page was changed somewhere else. Reload to get the latest version before editing again.',
      )
    }

    return unexpected('saveDraft', error, { pageId: parsed.data.pageId })
  }
}

const addSectionSchema = z.object({
  pageId: z.string().min(1),
  expectedVersion: z.number().int().min(0),
  type: sectionTypeSchema,
  /** Insert position; appended when omitted. */
  index: z.number().int().min(0).optional(),
})

export async function addSection(
  input: unknown,
): Promise<ActionResult<SaveDraftResult>> {
  await requireAdmin()

  const parsed = parseInput(addSectionSchema, input)
  if (!parsed.ok) return parsed.result

  try {
    const page = await getPageForEdit(parsed.data.pageId)
    if (!page) return fail('That page no longer exists.')

    const sections = [...page.draft.content.sections]
    const definition = sectionRegistry[parsed.data.type]

    if (definition.maxPerPage !== undefined) {
      const existing = sections.filter((s) => s.type === parsed.data.type).length
      if (existing >= definition.maxPerPage) {
        return fail(
          `A page can have at most ${definition.maxPerPage} ${definition.label} section${
            definition.maxPerPage === 1 ? '' : 's'
          }.`,
        )
      }
    }

    const section = createSection(parsed.data.type, randomUUID())
    const at = parsed.data.index ?? sections.length
    sections.splice(Math.min(at, sections.length), 0, section)

    const version = await saveDraftContent(
      parsed.data.pageId,
      { sections },
      parsed.data.expectedVersion,
    )

    return ok({ version })
  } catch (error) {
    if (error instanceof DraftConflictError) {
      return fail('This page was changed somewhere else. Reload before editing again.')
    }
    return unexpected('addSection', error)
  }
}

const publishSchema = z.object({ pageId: z.string().min(1) })

export async function publishPage(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin()

  const parsed = parseInput(publishSchema, input)
  if (!parsed.ok) return parsed.result

  try {
    const page = await getPageForEdit(parsed.data.pageId)
    if (!page) return fail('That page no longer exists.')

    // Validate the document that is about to go live, and confirm its
    // references still resolve, before anything is written.
    const validation = await validateForPublish(page.draft.content)

    if (!validation.ok) {
      return fail(describeIssues(validation.issues))
    }

    const published = await publishPageContent(
      parsed.data.pageId,
      validation.content,
      admin.adminId,
    )

    // updateTag, not revalidateTag: the admin clicks publish then "view site"
    // and must see their own change, not stale content (ARCHITECTURE.md §5.2).
    updateTag(cacheTags.page(published.slug))
    updateTag(cacheTags.pagesIndex)

    return ok()
  } catch (error) {
    return unexpected('publishPage', error, { pageId: parsed.data.pageId })
  }
}

export async function unpublishPage(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin()

  const parsed = parseInput(publishSchema, input)
  if (!parsed.ok) return parsed.result

  try {
    const page = await unpublishPageContent(parsed.data.pageId, admin.adminId)

    updateTag(cacheTags.page(page.slug))
    updateTag(cacheTags.pagesIndex)

    return ok()
  } catch (error) {
    return unexpected('unpublishPage', error, { pageId: parsed.data.pageId })
  }
}

const slugSchema = z
  .string()
  .min(1, 'Enter a URL slug.')
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers and single hyphens.',
  )

const createPageSchema = z.object({
  title: z.string().min(1, 'Enter a title.').max(120),
  slug: slugSchema,
})

export async function createNewPage(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(createPageSchema, {
    title: formData.get('title'),
    slug: formData.get('slug'),
  })
  if (!parsed.ok) return parsed.result

  let pageId: string

  try {
    const page = await createPage(parsed.data)
    pageId = page.id
    updateTag(cacheTags.pagesIndex)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return fail('That URL slug is already in use.', { slug: ['Already in use.'] })
    }
    return unexpected('createNewPage', error)
  }

  redirect(`/admin/pages/${pageId}`)
}

const settingsSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(1, 'Enter a title.').max(120),
  slug: slugSchema,
  seoTitle: z.string().max(160),
  seoDescription: z.string().max(320),
  seoNoIndex: z.boolean(),
  seoImageId: z.string().nullable(),
})

export async function savePageSettings(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(settingsSchema, {
    pageId: formData.get('pageId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
    seoNoIndex: formData.get('seoNoIndex') === 'on',
    seoImageId: (formData.get('seoImageId') as string) || null,
  })
  if (!parsed.ok) return parsed.result

  try {
    const result = await updatePageSettings(parsed.data.pageId, {
      title: parsed.data.title,
      slug: parsed.data.slug,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      seoImageId: parsed.data.seoImageId,
      seoNoIndex: parsed.data.seoNoIndex,
    })

    // A slug change orphans the old URL's cache entry, so both are invalidated.
    updateTag(cacheTags.page(result.previousSlug))
    updateTag(cacheTags.page(result.slug))
    updateTag(cacheTags.pagesIndex)
    revalidatePath('/admin/pages')

    return ok()
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return fail('That URL slug is already in use.', { slug: ['Already in use.'] })
    }
    return unexpected('savePageSettings', error)
  }
}

export async function removePage(input: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(publishSchema, input)
  if (!parsed.ok) return parsed.result

  try {
    const page = await deletePage(parsed.data.pageId)

    updateTag(cacheTags.page(page.slug))
    updateTag(cacheTags.pagesIndex)

    return ok()
  } catch (error) {
    if (error instanceof Error && error.message.includes('System pages')) {
      return fail('System pages cannot be deleted.')
    }
    return unexpected('removePage', error)
  }
}
