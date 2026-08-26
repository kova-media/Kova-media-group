import 'server-only'

import { draftMode } from 'next/headers'

import { logger } from '@/lib/logger'

import { getDraftPage } from './admin-queries'
import { getPublishedPage } from './queries'
import type { RichText } from './schemas/rich-text'
import type { PageContent } from './schemas/page'
import { getMediaAssets } from './resolvers'
import { getCaseStudyList, getTestimonialList } from './site-content'
import type { CaseStudyView, TestimonialView } from './site-content'
import type { MediaAssetDto } from './types'

/**
 * The bridge between the CMS and the designed marketing routes.
 *
 * Each of `/`, `/about`, `/services`, `/process`, `/case-studies`, `/contact`
 * and `/book` is a `Page` row whose document holds the designed bands in order.
 * The route asks for its page by slug and hands the sections to the renderer;
 * it does not know any of the copy.
 *
 * **The database is the only source of published content.** There is no
 * render-time fallback to the bundled documents in `blueprints.ts`: those exist
 * to *seed* the CMS, and once seeded the admin is authoritative. A page with no
 * sections renders no sections.
 *
 * That is the whole point. If a component quietly substituted its own copy for
 * missing CMS content, the owner would delete a paragraph, see it still on the
 * site, and correctly conclude the admin does not work. An empty page is a
 * visible, fixable problem; a page silently serving code is not.
 *
 * An *unreachable* database is caught separately — logged at error level and
 * treated as "no content for this request", so an outage costs a thin page
 * rather than a 500. The catch sits outside the `'use cache'` scope, so nothing
 * wrong is ever written to the cache.
 */
export type MarketingPage = {
  slug: string
  title: string
  seo: { title: string; description: string }
  sections: PageContent['sections']
  /** True when the document came from `draftContent` (preview). */
  isDraft: boolean
  /** False when no such page is published. The route turns this into a 404. */
  exists: boolean
}

export async function getMarketingPage(
  slug: string,
  options: { draft?: boolean } = {},
): Promise<MarketingPage> {
  let page: Awaited<ReturnType<typeof getPublishedPage>> = null

  try {
    page = options.draft ? await getDraftPage(slug) : await getPublishedPage(slug)
  } catch (error) {
    // An outage, not an editorial decision. Logged loudly; treated as "nothing
    // to show for this request" rather than allowed to take the page down.
    logger.error(`Could not read the "${slug}" page`, { error })
  }

  if (!page) {
    return {
      slug,
      title: '',
      seo: { title: '', description: '' },
      sections: [],
      isDraft: Boolean(options.draft),
      exists: false,
    }
  }

  return {
    slug: page.slug,
    title: page.title,
    seo: {
      title: page.seo.title ?? page.title,
      description: page.seo.description ?? '',
    },
    sections: page.content.sections,
    isDraft: page.isDraft,
    exists: true,
  }
}

/**
 * What a designed route calls.
 *
 * Draft Mode is the only difference between the preview and the live render:
 * enabled, the document comes from `draftContent` and every `'use cache'` scope
 * is bypassed for the request; disabled, it is the published document out of
 * the cache. Both branches produce the same shape and feed the same renderer.
 */
export async function loadMarketingPage(slug: string): Promise<MarketingPage> {
  const { isEnabled } = await draftMode()
  return getMarketingPage(slug, { draft: isEnabled })
}

/**
 * Library content a page's sections depend on.
 *
 * Fetched once per render rather than per section, and only when a section that
 * needs it is actually enabled — both reads are cached and tag-invalidated, so
 * a warm cache performs no database work at all.
 */
export type MarketingReferences = {
  caseStudies: CaseStudyView[]
  testimonials: TestimonialView[]
  /** Every image the visible sections point at, keyed by id. */
  media: Map<string, MediaAssetDto>
}

const CASE_STUDY_SECTIONS = new Set(['WORK_INDEX', 'CASE_STUDY_LIST'])

/**
 * Media ids anywhere in a section's data.
 *
 * Walks rather than reading known keys, so a new section type with an image
 * field resolves without anyone remembering to update this — the failure mode
 * otherwise is an image that is configured, validates, publishes, and silently
 * does not appear.
 */
function collectMediaIds(sections: PageContent['sections']): string[] {
  const ids = new Set<string>()

  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'mediaId' && typeof nested === 'string' && nested) ids.add(nested)
      else walk(nested)
    }
  }

  sections.forEach((section) => walk(section.data))
  return [...ids]
}

export async function resolveMarketingReferences(
  sections: PageContent['sections'],
): Promise<MarketingReferences> {
  const enabled = sections.filter((section) => section.isEnabled)
  const needsCaseStudies = enabled.some((section) =>
    CASE_STUDY_SECTIONS.has(section.type),
  )
  const needsTestimonials = enabled.some((section) => section.type === 'TESTIMONIALS')
  const mediaIds = collectMediaIds(enabled)

  const [caseStudies, testimonials, media] = await Promise.all([
    needsCaseStudies ? getCaseStudyList() : Promise.resolve([]),
    needsTestimonials ? getTestimonialList() : Promise.resolve([]),
    mediaIds.length
      ? getMediaAssets(mediaIds)
      : Promise.resolve(new Map<string, MediaAssetDto>()),
  ])

  return { caseStudies, testimonials, media }
}

/**
 * Flattens a rich-text answer to plain paragraphs.
 *
 * The FAQ accordion is designed for short prose, so the tree is reduced to text
 * on the way out. Anything richer than paragraphs and lists would be lost,
 * which is why the editor's FAQ answers are meant to stay short.
 */
export function flattenRichText(nodes: RichText): string {
  return nodes
    .map((node) => {
      if (node.type === 'list') {
        return node.items
          .map((item) => item.map((inline) => inlineText(inline)).join(''))
          .join(' ')
      }

      return 'children' in node
        ? node.children.map((inline) => inlineText(inline)).join('')
        : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function inlineText(node: { type: string; text?: string; children?: unknown }): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.children)) {
    return (node.children as { type: string; text?: string }[])
      .map((child) => inlineText(child))
      .join('')
  }
  return ''
}
