import type { Metadata } from 'next'
import { resources } from '@/lib/site-data'
import { Container } from '@/components/site/ui'
import { PageHeader } from '@/components/site/page-header'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { FinalCta } from '@/features/marketing/sections'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Practical guides on email and SMS marketing for ecommerce — automation, deliverability, segmentation, and strategy from Kova Media Group.',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ResourcesPage() {
  // The first article is given the featured treatment; the rest fill the grid.
  // Destructuring an array cannot prove the first element exists, so the empty
  // case is handled explicitly rather than asserted away.
  const [featured, ...rest] = resources

  if (!featured) return null

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Field notes on email & SMS that actually works."
        description="No fluff, no theory for its own sake — practical thinking on the channels we run every day for ecommerce brands."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          <Reveal>
            <article className="group grid gap-8 rounded-2xl border border-border bg-card p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    Featured
                  </span>
                  <span>{featured.category}</span>
                </div>
                <h2 className="mt-6 text-3xl font-medium leading-tight tracking-tight text-balance sm:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {featured.excerpt}
                </p>
                <div className="mt-6 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  <span>{formatDate(featured.date)}</span>
                  <span className="h-3 w-px bg-border" aria-hidden />
                  <span>{featured.readTime}</span>
                </div>
              </div>
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/50">
                <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
                <span className="font-mono text-6xl font-medium text-primary/30">
                  {featured.category.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </article>
          </Reveal>

          <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <RevealItem key={post.slug}>
                <article className="group flex h-full cursor-default flex-col rounded-xl border border-border bg-card p-7 transition-colors hover:border-foreground/20">
                  <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                    <span className="text-primary">{post.category}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-medium leading-snug tracking-tight text-balance">
                    {post.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-border pt-5 font-mono text-xs text-muted-foreground">
                    <span>{formatDate(post.date)}</span>
                    <span className="h-3 w-px bg-border" aria-hidden />
                    <span>{post.readTime}</span>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-8">
            <p className="text-center text-sm text-muted-foreground">
              Want these in your inbox? Mention it on your intro call.
            </p>
          </Reveal>
        </Container>
      </section>

      <FinalCta />
    </>
  )
}
