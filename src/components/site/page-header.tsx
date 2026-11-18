import { Container } from './ui'
import { Reveal } from './reveal'

/**
 * The standard interior-page masthead.
 *
 * `pt-36` clears the fixed header — the layout reserves no space for it, so
 * every top-level section owns its own clearance.
 *
 * The standfirst accepts either `description` or `intro`. The v0 pages call it
 * `description` while the component was written with `intro`; that mismatch was
 * invisible because the v0 build set `typescript.ignoreBuildErrors`, and it
 * silently dropped the paragraph from every interior page. Both names are
 * supported so the ported pages render as designed.
 *
 * Composition note. This used to be a centred stack of eyebrow, headline, and
 * paragraph over a radially-masked grid — the same opening move as every other
 * section, and the radial mask read as a glow behind the type. It is now a
 * two-column masthead: the page label sits in its own narrow column beside the
 * headline rather than stacked above it, so the label is structural (it tells
 * you where you are) instead of a decorative run-up to the real sentence. The
 * grid stays, because a measured technical grid is on-brand, but it is masked
 * linearly to the top edge so it reads as ruling rather than as ambient light.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  description,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  description?: string
  children?: React.ReactNode
}) {
  const standfirst = description ?? intro
  return (
    <section className="relative overflow-hidden border-b border-border bg-background pt-36 pb-16 md:pt-44 md:pb-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-[0.55]"
        aria-hidden
      >
        <div className="grid-lines h-full w-full" />
      </div>
      <Container>
        <div className="grid gap-x-12 gap-y-6 md:grid-cols-[10rem_1fr]">
          <Reveal className="md:pt-4">
            <span className="block text-[0.8125rem] leading-none font-medium tracking-[0.08em] text-foreground/65 uppercase">
              {eyebrow}
            </span>
            <span className="mt-4 hidden h-px w-10 bg-brand md:block" aria-hidden />
          </Reveal>

          <div className="max-w-3xl">
            <Reveal delay={0.05}>
              <h1 className="tracking-tightest text-5xl leading-[1.03] font-semibold text-balance text-foreground md:text-6xl">
                {title}
              </h1>
            </Reveal>
            {standfirst && (
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground md:text-xl">
                  {standfirst}
                </p>
              </Reveal>
            )}
            {children && (
              <Reveal delay={0.15}>
                <div className="mt-9">{children}</div>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
