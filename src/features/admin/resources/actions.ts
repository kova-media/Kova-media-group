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
import { DraftConflictError } from '@/server/content/mutations'
import {
  createResource,
  deleteResource,
  publishResource,
  reorderResources,
  saveResourceDraft,
  unpublishResource,
  updateResourceFields,
} from '@/server/content/resource-mutations'
import { pageContentSchema, type PageContent } from '@/server/content/schemas/page'

/**
 * Resource mutations.
 *
 * Same shape as the page and case study actions: authorize, validate, write,
 * invalidate (CODING_STANDARDS.md §5).
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
 * An article appears on its own page, the resources index, and the homepage
 * preview, so a publish has to clear all three.
 */
function invalidate(slug: string, previousSlug?: string) {
  updateTag(cacheTags.resource(slug))
  if (previousSlug && previousSlug !== slug) {
    updateTag(cacheTags.resource(previousSlug))
  }
  updateTag(cacheTags.resourcesIndex)
  revalidatePath('/resources')
  revalidatePath('/')
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}

export async function createResourceAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(
    z.object({
      title: z.string().trim().min(1, 'A title is required.').max(200),
      category: z.string().trim().min(1, 'A category is required.').max(60),
      slug: slugSchema,
    }),
    {
      title: formData.get('title'),
      category: formData.get('category'),
      slug: formData.get('slug'),
    },
  )

  if (!parsed.ok) return parsed.result

  let id: string

  try {
    const created = await createResource(parsed.data)
    id = created.id
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail('That URL slug is already taken.', {
        slug: ['That URL slug is already taken.'],
      })
    }
    return unexpected('createResource', error)
  }

  invalidate(parsed.data.slug)
  // Outside the try: redirect() throws by design.
  redirect(`/admin/resources/${id}`)
}

const detailsSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  title: z.string().trim().min(1, 'A title is required.').max(200),
  excerpt: z.string().trim().max(400),
  category: z.string().trim().min(1, 'A category is required.').max(60),
  readTime: z.string().trim().max(40),
  coverId: z.string().trim().max(64),
  isFeatured: z.coerce.boolean(),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(320),
})

export async function saveResourceDetails(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(detailsSchema, {
    id: formData.get('id'),
    slug: formData.get('slug'),
    title: formData.get('title'),
    excerpt: formData.get('excerpt') ?? '',
    category: formData.get('category'),
    readTime: formData.get('readTime') ?? '',
    coverId: formData.get('coverId') ?? '',
    isFeatured: formData.get('isFeatured') === 'on',
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
  })

  if (!parsed.ok) return parsed.result

  const { id, ...fields } = parsed.data

  try {
    const { previousSlug, slug } = await updateResourceFields(id, {
      slug: fields.slug,
      title: fields.title,
      excerpt: fields.excerpt,
      category: fields.category,
      readTime: fields.readTime || '5 min read',
      coverId: fields.coverId || null,
      isFeatured: fields.isFeatured,
      seoTitle: fields.seoTitle || null,
      seoDescription: fields.seoDescription || null,
    })

    invalidate(slug, previousSlug)
    return ok()
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail('That URL slug is already taken.', {
        slug: ['That URL slug is already taken.'],
      })
    }
    return unexpected('saveResourceDetails', error)
  }
}

export async function saveResourceBody(
  input: unknown,
): Promise<ActionResult<{ version: number }>> {
  await requireAdmin()

  const parsed = parseInput(
    z.object({
      id: z.string().min(1),
      expectedVersion: z.number().int().min(0),
      content: pageContentSchema,
    }),
    input,
  )

  if (!parsed.ok) return parsed.result

  try {
    const version = await saveResourceDraft(
      parsed.data.id,
      // The schema validated each section against its registered type, so the
      // narrowing is sound; Zod's inferred output keeps `type` as string.
      { sections: parsed.data.content.sections as PageContent['sections'] },
      parsed.data.expectedVersion,
    )

    return ok({ version })
  } catch (error) {
    if (error instanceof DraftConflictError) {
      return fail(
        'This article was changed in another tab. Reload to see the latest version.',
      )
    }
    return unexpected('saveResourceBody', error)
  }
}

export async function publishResourceAction(
  id: string,
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireAdmin()

  try {
    const { getResourceForEdit } = await import('@/server/content/resource-queries')
    const resource = await getResourceForEdit(id)

    if (!resource) return fail('That article no longer exists.')
    if (!resource.excerpt.trim()) {
      return fail('Cannot publish — an excerpt is required for the index card.')
    }
    if (resource.draft.sections.length === 0) {
      return fail('Cannot publish — the article has no content yet.')
    }

    const { slug } = await publishResource(id, session.adminId)
    invalidate(slug)

    return ok({ slug })
  } catch (error) {
    return unexpected('publishResource', error)
  }
}

export async function unpublishResourceAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin()

  try {
    const { slug } = await unpublishResource(id, session.adminId)
    invalidate(slug)
    return ok()
  } catch (error) {
    return unexpected('unpublishResource', error)
  }
}

export async function deleteResourceAction(id: string): Promise<ActionResult> {
  await requireAdmin()

  let slug: string

  try {
    const deleted = await deleteResource(id)
    slug = deleted.slug
  } catch (error) {
    return unexpected('deleteResource', error)
  }

  invalidate(slug)
  redirect('/admin/resources')
}

export async function reorderResourcesAction(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(z.array(z.string().min(1)).max(200), orderedIds)
  if (!parsed.ok) return parsed.result

  try {
    await reorderResources(parsed.data)
    updateTag(cacheTags.resourcesIndex)
    revalidatePath('/resources')
    revalidatePath('/')
    return ok()
  } catch (error) {
    return unexpected('reorderResources', error)
  }
}
