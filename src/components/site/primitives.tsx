import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Server-safe layout primitives.
 *
 * `components/site/ui.tsx` is a Client Component (it carries motion), so
 * importing `Container` from there drags any server component that needs a
 * width into the client bundle. These are the same measurements with no
 * client boundary — used by the CMS section renderer and other server-rendered
 * surfaces.
 *
 * The width matches `ui.tsx` exactly (76rem / px-6 / md:px-8). If one changes,
 * both change.
 */
export function Container({
  className,
  width = 'wide',
  ...props
}: ComponentProps<'div'> & { width?: 'content' | 'wide' }) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 md:px-8',
        width === 'content' ? 'max-w-3xl' : 'max-w-[76rem]',
        className,
      )}
      {...props}
    />
  )
}

/** Vertical rhythm between sections, matching the v0 section spacing. */
export function Section({
  className,
  spacing = 'base',
  tone = 'background',
  ...props
}: ComponentProps<'section'> & {
  spacing?: 'sm' | 'base' | 'lg'
  tone?: 'background' | 'surface'
}) {
  const padding = {
    sm: 'py-14',
    base: 'py-24 md:py-32',
    lg: 'py-28 md:py-40',
  }[spacing]

  return (
    <section
      className={cn(padding, tone === 'surface' && 'bg-surface', className)}
      {...props}
    />
  )
}

/**
 * The section label. Mirrors `Eyebrow` in ui.tsx — read the note there for why
 * it is sized and marked the way it is. If one changes, both change.
 */
export function Eyebrow({ className, children, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-3.5 text-[0.8125rem] leading-none font-medium tracking-[0.08em] text-foreground/65 uppercase',
        className,
      )}
      {...props}
    >
      <span className="h-px w-7 shrink-0 bg-brand" aria-hidden />
      {children}
    </span>
  )
}
