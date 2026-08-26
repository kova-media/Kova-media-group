import 'server-only'

import { prisma } from '@/db/prisma'

/**
 * Content library writes — testimonials and partner logos.
 *
 * These entities have no draft/publish split: they are short, single-field
 * records, and `isPublished` is the whole workflow. A revision history for a
 * one-line quote would be ceremony without value.
 *
 * Editing one of these is intentionally cheap. A testimonial's text is resolved
 * at render time by id (ADR-012), so fixing a typo updates every page showing
 * it without republishing any of them.
 */

export type TestimonialInput = {
  quote: string
  authorName: string
  authorRole: string | null
  companyName: string
  avatarId: string | null
  companyLogoId: string | null
  isPublished: boolean
}

export async function createTestimonial(input: TestimonialInput) {
  const last = await prisma.testimonial.findFirst({
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  return prisma.testimonial.create({
    data: { ...input, position: (last?.position ?? -1) + 1 },
    select: { id: true },
  })
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  await prisma.testimonial.update({ where: { id }, data: input })
}

export async function deleteTestimonial(id: string) {
  await prisma.testimonial.delete({ where: { id } })
}

/** Applies an explicit order. Sent as the full list, so gaps cannot accumulate. */
export async function reorderTestimonials(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.testimonial.update({ where: { id }, data: { position: index } }),
    ),
  )
}
