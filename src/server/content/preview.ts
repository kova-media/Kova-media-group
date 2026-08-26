import 'server-only'

import { prisma } from '@/db/prisma'

/**
 * Resolves a preview target from the database.
 *
 * Exists so the preview route handler never touches Prisma directly — route
 * files call the data access layer (ARCHITECTURE.md §3).
 *
 * It also enforces the open-redirect defence: the caller redirects to the path
 * this function derives from a real row, never to the raw query parameter.
 */
export type PreviewTarget = { path: string }

export async function resolvePreviewTarget(
  type: string,
  slug: string,
): Promise<PreviewTarget | null> {
  if (type === 'case-study') {
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { slug },
      select: { slug: true },
    })

    // `/case-studies/…`, not `/work/…`: the route was renamed and this was
    // left behind, so every case study preview redirected to a 404.
    return caseStudy ? { path: `/case-studies/${caseStudy.slug}` } : null
  }

  const page = await prisma.page.findUnique({
    where: { slug },
    select: { slug: true },
  })

  if (!page) return null

  return { path: page.slug === 'home' ? '/' : `/${page.slug}` }
}
