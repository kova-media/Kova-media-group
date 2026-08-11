import { Container, Eyebrow } from './ui'
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
    <section className="relative overflow-hidden border-b border-border bg-background pb-16 pt-36 md:pb-24 md:pt-44">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        aria-hidden
      >
        <div className="grid-lines h-full w-full" />
      </div>
      <Container>
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.03] tracking-tightest text-foreground md:text-6xl">
              {title}
            </h1>
          </Reveal>
          {standfirst && (
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
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
      </Container>
    </section>
  )
}
