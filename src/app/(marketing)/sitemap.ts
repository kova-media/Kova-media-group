import type { MetadataRoute } from 'next'

import { env } from '@/env'
import { routes } from '@/lib/constants'
import { getPublishedPageSlugs } from '@/server/content/queries'
import { getCaseStudySlugs } from '@/server/content/site-content'

/**
 * The sitemap.
 *
 * Static routes are listed explicitly; CMS pages and case studies come from the
 * database, so publishing a new study adds it here without a code change. Pages
 * marked `noIndex` are already excluded by `getPublishedPageSlugs`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')

  const staticRoutes: { path: string; priority: number }[] = [
    { path: routes.home, priority: 1 },
    { path: routes.services, priority: 0.9 },
    { path: routes.caseStudies, priority: 0.9 },
    { path: routes.book, priority: 0.9 },
    { path: routes.process, priority: 0.7 },
    { path: routes.about, priority: 0.7 },
    { path: routes.resources, priority: 0.7 },
    { path: routes.contact, priority: 0.8 },
  ]

  const [cmsSlugs, studySlugs] = await Promise.all([
    getPublishedPageSlugs(),
    getCaseStudySlugs(),
  ])

  // "home" has its own route; the rest of the CMS pages resolve via the
  // catch-all. Routes already listed above must not be duplicated.
  const listed = new Set(staticRoutes.map((route) => route.path))

  const cmsEntries = cmsSlugs
    .filter((slug) => slug !== 'home')
    .map((slug) => `/${slug}`)
    .filter((path) => !listed.has(path))
    .map((path) => ({ url: `${base}${path}`, priority: 0.5 }))

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route.path === '/' ? '' : route.path}`,
      priority: route.priority,
    })),
    ...studySlugs.map((slug) => ({
      url: `${base}${routes.caseStudy(slug)}`,
      priority: 0.8,
    })),
    ...cmsEntries,
  ]
}
