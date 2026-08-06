import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Horizontal rhythm for the public site. Width comes from tokens, never ad hoc. */
export function Container({
  className,
  width = 'wide',
  ...props
}: ComponentProps<'div'> & { width?: 'content' | 'wide' }) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-gutter',
        width === 'content' ? 'max-w-content' : 'max-w-wide',
        className,
      )}
      {...props}
    />
  )
}

/** Vertical rhythm between sections. */
export function Section({
  className,
  spacing = 'base',
  ...props
}: ComponentProps<'section'> & { spacing?: 'sm' | 'base' | 'lg' }) {
  const padding = {
    sm: 'py-section-sm',
    base: 'py-section',
    lg: 'py-section-lg',
  }[spacing]

  return <section className={cn(padding, className)} {...props} />
}

export function Eyebrow({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'text-2xs font-medium tracking-wide text-ink-500 uppercase',
        className,
      )}
      {...props}
    />
  )
}
