import 'server-only'

import { draftMode } from 'next/headers'

import { getBlueprint } from './blueprints'
import { getDraftPage } from './admin-queries'
import { getPublishedPage } from './queries'
import type { RichText } from './schemas/rich-text'
import type { PageContent } from './schemas/page'
import { getCaseStudyList, getTestimonialList } from './site-content'
import type { CaseStudyView, TestimonialView } from './site-content'

/**
 * The bridge between the CMS and the designed marketing routes.
 *
 * Each of `/`, `/about`, `/services`, `/process`, `/case-studies`, `/contact`
 * and `/book` is a `Page` row whose document holds the designed bands in order.
 * The route asks for its page by slug and hands the sections to the renderer;
 * it does not know any of the copy.
 *
 * **The blueprint is the floor, the database is the override.** When a page has
 * never been seeded — a fresh clone, a new preview environment, a migration
 * that has not run — the bundled document in `blueprints.ts` renders instead of
 * an empty page. That is the same rule `site-content.ts` already applies to
 * case studies, and it is what keeps a missing row from taking the marketing
 * site down.
 */
export type MarketingPage = {
  slug: string
  title: string
  seo: { title: string; description: string }
  sections: PageContent['sections']
  /** True when the document came from `draftContent` (preview). */
  isDraft: boolean
  /** True when nothing in the database matched and the bundled copy is showing. */
  isFallback: boolean
}

export async function getMarketingPage(
  slug: string,
  options: { draft?: boolean } = {},
): Promise<MarketingPage> {
  const blueprint = getBlueprint(slug)
  const page = options.draft ? await getDraftPage(slug) : await getPublishedPage(slug)

  // An existing row with an empty document is treated as "not set up yet"
  // rather than "deliberately blank": publishing a page with no sections at all
  // is not something an editor does on purpose, and rendering a bare header and
  // footer would look like an outage.
  const hasContent = (page?.content.sections.length ?? 0) > 0

  if (page && hasContent) {
    return {
      slug: page.slug,
      title: page.title,
      seo: {
        title: page.seo.title ?? blueprint?.seoTitle ?? page.title,
        description: page.seo.description ?? blueprint?.seoDescription ?? '',
      },
      sections: page.content.sections,
      isDraft: page.isDraft,
      isFallback: false,
    }
  }

  if (!blueprint) {
    return {
      slug,
      title: page?.title ?? '',
      seo: { title: page?.seo.title ?? page?.title ?? '', description: '' },
      sections: [],
      isDraft: Boolean(options.draft),
      isFallback: true,
    }
  }

  return {
    slug: blueprint.slug,
    title: blueprint.title,
    seo: {
      title: page?.seo.title ?? blueprint.seoTitle,
      description: page?.seo.description ?? blueprint.seoDescription,
    },
    sections: blueprint.content.sections,
    isDraft: Boolean(options.draft),
    isFallback: true,
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
}

const CASE_STUDY_SECTIONS = new Set(['WORK_INDEX', 'CASE_STUDY_LIST'])

export async function resolveMarketingReferences(
  sections: PageContent['sections'],
): Promise<MarketingReferences> {
  const enabled = sections.filter((section) => section.isEnabled)
  const needsCaseStudies = enabled.some((section) =>
    CASE_STUDY_SECTIONS.has(section.type),
  )
  const needsTestimonials = enabled.some((section) => section.type === 'TESTIMONIALS')

  const [caseStudies, testimonials] = await Promise.all([
    needsCaseStudies ? getCaseStudyList() : Promise.resolve([]),
    needsTestimonials ? getTestimonialList() : Promise.resolve([]),
  ])

  return { caseStudies, testimonials }
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
