'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

import { ok, parseInput, unexpected, type ActionResult } from '@/server/actions/result'
import { requireAdmin } from '@/server/auth/dal'
import { cacheTags } from '@/server/cache/tags'
import {
  createTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  updateTestimonial,
} from '@/server/content/library-mutations'

/**
 * Content library mutations.
 *
 * Invalidation is per-entity where it can be (a testimonial has its own tag)
 * plus the index, because sections that render "all published" depend on the
 * collection rather than on any one row.
 */
function invalidateTestimonial(id?: string) {
  if (id) updateTag(cacheTags.testimonial(id))
  updateTag(cacheTags.testimonialsIndex)
  revalidatePath('/')
  revalidatePath('/about')
}

const testimonialSchema = z.object({
  id: z.string().optional(),
  quote: z.string().trim().min(1, 'A quote is required.').max(1000),
  authorName: z.string().trim().min(1, 'An attribution is required.').max(120),
  authorRole: z.string().trim().max(120),
  companyName: z.string().trim().min(1, 'A company is required.').max(160),
  avatarId: z.string().trim().max(64),
  companyLogoId: z.string().trim().max(64),
  isPublished: z.coerce.boolean(),
})

export async function saveTestimonial(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(testimonialSchema, {
    id: formData.get('id') || undefined,
    quote: formData.get('quote'),
    authorName: formData.get('authorName'),
    authorRole: formData.get('authorRole') ?? '',
    companyName: formData.get('companyName'),
    avatarId: formData.get('avatarId') ?? '',
    companyLogoId: formData.get('companyLogoId') ?? '',
    isPublished: formData.get('isPublished') === 'on',
  })

  if (!parsed.ok) return parsed.result

  const { id, authorRole, avatarId, companyLogoId, ...rest } = parsed.data

  const input = {
    ...rest,
    authorRole: authorRole || null,
    avatarId: avatarId || null,
    companyLogoId: companyLogoId || null,
  }

  try {
    if (id) {
      await updateTestimonial(id, input)
      invalidateTestimonial(id)
    } else {
      const created = await createTestimonial(input)
      invalidateTestimonial(created.id)
    }

    revalidatePath('/admin/library/testimonials')
    return ok()
  } catch (error) {
    return unexpected('saveTestimonial', error)
  }
}

export async function removeTestimonial(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    await deleteTestimonial(id)
    invalidateTestimonial(id)
    revalidatePath('/admin/library/testimonials')
    return ok()
  } catch (error) {
    return unexpected('removeTestimonial', error)
  }
}

export async function reorderTestimonialsAction(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseInput(z.array(z.string().min(1)).max(200), orderedIds)
  if (!parsed.ok) return parsed.result

  try {
    await reorderTestimonials(parsed.data)
    invalidateTestimonial()
    revalidatePath('/admin/library/testimonials')
    return ok()
  } catch (error) {
    return unexpected('reorderTestimonials', error)
  }
}
