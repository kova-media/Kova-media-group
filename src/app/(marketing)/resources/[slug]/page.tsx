import type { Metadata } from 'next'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Container, Eyebrow } from '@/components/site/ui'
import { FinalCta } from '@/features/marketing/sections'
import { SectionRenderer } from '@/features/sections/section-renderer'
import { resolveReferences } from '@/server/content/resolve-references'
import {
  getDraftResource,
  getPublishedResource,
} from '@/server/content/resource-queries'
import { safePublishedResourceSlugs } from '@/server/content/static-params'

/**
 * Prerenders every published article (ADR-017). A newly published piece is
 * served on demand until the next build picks it up.
 */
export async function generateStaticParams() {
  // Cache Components requires at least one result, and the article collection
  // is legitimately empty until the first piece is published — hence the
  // shared sentinel helper rather than a bare read.
  const slugs = await safePublishedResourceSlugs()
  return slugs.map((slug) => ({ slug }))
}

async function loadResource(slug: string) {
  const { isEnabled } = await draftMode()
  // Draft Mode bypasses every 'use cache' scope for this request, so the draft
  // read is always fresh and is never written back to the cache.
  return isEnabled ? getDraftResource(slug) : getPublishedResource(slug)
}

export async function generateMetadata({
  params,
}: PageProps<'/resources/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const resource = await loadResource(slug)

  // See the case study route: notFound() in metadata is what produces a real
  // 404 on the first, uncached request.
  if (!resource) notFound()

  return {
    title: resource.seo.title ?? resource.title,
    description: resource.seo.description ?? resource.excerpt,
  }
}

/**
 * Blocking rather than instant-shell (ADR-017 revisited).
 *
 * Every published slug is prerendered by `generateStaticParams`, so real pages
 * are served as static HTML and lose nothing here. The only URLs that reach a
 * runtime render are ones that do not exist — and with an instant shell those
 * flush a 200 before `notFound()` is ever reached, producing a soft 404 that
 * search engines treat as a thin page. Blocking lets the 404 status be set
 * correctly, which matters more than an instant shell on a URL with no content.
 */
export const instant = false

export default async function ResourcePage({ params }: PageProps<'/resources/[slug]'>) {
  const { slug } = await params
  const resource = await loadResource(slug)

  if (!resource) notFound()

  const refs = await resolveReferences(resource.content)

  return (
    <>
      <section className="border-b border-border pt-32 pb-14 sm:pt-40">
        <Container>
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All resources
          </Link>

          <div className="mt-8 max-w-3xl">
            <Eyebrow>{resource.category}</Eyebrow>
            <h1 className="tracking-tightest mt-6 text-4xl leading-[1.05] font-semibold text-balance text-foreground md:text-5xl">
              {resource.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
              {resource.excerpt}
            </p>
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              {resource.readTime}
            </p>
          </div>
        </Container>
      </section>

      {/* The article body renders through the same section renderer as every
          other page — one rendering path, no special case for articles. The
          renderer supplies its own container and vertical rhythm, so there is
          no wrapper here to double the padding. */}
      <article>
        <SectionRenderer content={resource.content} refs={refs} />
      </article>

      <FinalCta />
    </>
  )
}
