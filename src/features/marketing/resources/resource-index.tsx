'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Container } from '@/components/site/ui'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { cn } from '@/lib/utils'
import type { Resource } from '@/lib/site-data'

/**
 * The resource centre index.
 *
 * Filtering and search are client-side and deliberately so: the whole
 * collection is a handful of articles that already shipped with the page, so a
 * round trip per keystroke would be slower and worse. If the library ever grows
 * past a couple of hundred pieces this becomes a server concern — the component
 * boundary is drawn so that change touches only this file.
 *
 * The card markup is the v0 design, unchanged. Only the filtering shell around
 * it is new.
 */
const ALL = 'All'

export function ResourceIndex({
  resources,
  linkable,
}: {
  resources: Resource[]
  /** False when showing bundled fallbacks, which have no detail page yet. */
  linkable: boolean
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)

  const categories = useMemo(
    () => [ALL, ...[...new Set(resources.map((item) => item.category))].sort()],
    [resources],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return resources.filter((item) => {
      if (category !== ALL && item.category !== category) return false
      if (!needle) return true

      return (
        item.title.toLowerCase().includes(needle) ||
        item.excerpt.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle)
      )
    })
  }, [resources, query, category])

  const [featured, ...rest] = filtered
  // The featured treatment only makes sense on the unfiltered view; once the
  // reader is searching, every result should be weighted equally.
  const isBrowsing = category === ALL && !query.trim()

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm transition-colors duration-200',
                    category === item
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="relative md:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search resources"
                aria-label="Search resources"
                className="w-full rounded-full border border-border bg-card py-2.5 pr-4 pl-11 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:ring-2 focus:ring-brand/15"
              />
            </div>
          </div>
        </Reveal>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">
            Nothing matches that yet. Try a different search.
          </p>
        )}

        {isBrowsing && featured && (
          <Reveal className="mt-10">
            <FeaturedCard resource={featured} linkable={linkable} />
          </Reveal>
        )}

        <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(isBrowsing ? rest : filtered).map((post) => (
            <RevealItem key={post.slug}>
              <ArticleCard resource={post} linkable={linkable} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function CardShell({
  resource,
  linkable,
  className,
  children,
}: {
  resource: Resource
  linkable: boolean
  className: string
  children: React.ReactNode
}) {
  if (!linkable) {
    return <article className={className}>{children}</article>
  }

  return (
    <Link href={`/resources/${resource.slug}`} className={className}>
      {children}
    </Link>
  )
}

function FeaturedCard({
  resource,
  linkable,
}: {
  resource: Resource
  linkable: boolean
}) {
  return (
    <CardShell
      resource={resource}
      linkable={linkable}
      className="group grid gap-8 rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20 sm:p-12 lg:grid-cols-2 lg:items-center"
    >
      <div>
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">
            Featured
          </span>
          <span>{resource.category}</span>
        </div>
        <h2 className="mt-6 text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl">
          {resource.title}
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">{resource.excerpt}</p>
        <div className="mt-6 flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span>{formatDate(resource.date)}</span>
          <span className="h-3 w-px bg-border" aria-hidden />
          <span>{resource.readTime}</span>
        </div>
      </div>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/50">
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
        <span className="font-mono text-6xl font-medium text-brand/30">
          {resource.category.slice(0, 2).toUpperCase()}
        </span>
      </div>
    </CardShell>
  )
}

function ArticleCard({
  resource,
  linkable,
}: {
  resource: Resource
  linkable: boolean
}) {
  return (
    <CardShell
      resource={resource}
      linkable={linkable}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-7 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
        <span className="text-brand">{resource.category}</span>
      </div>
      <h3 className="mt-4 text-xl leading-snug font-medium tracking-tight text-balance">
        {resource.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {resource.excerpt}
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-border pt-5 font-mono text-xs text-muted-foreground">
        <span>{formatDate(resource.date)}</span>
        <span className="h-3 w-px bg-border" aria-hidden />
        <span>{resource.readTime}</span>
      </div>
    </CardShell>
  )
}
