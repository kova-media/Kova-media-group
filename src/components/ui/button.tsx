import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Admin button (ADR-008 — the public site uses its own primitives).
 * Shaped to be drop-in compatible with shadcn/ui's API so that later
 * shadcn components compose with it without adaptation.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-ink-800 disabled:hover:bg-primary',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-ink-200 disabled:hover:bg-secondary',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  icon: 'size-9',
}

export type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap',
        'duration-fast transition-colors ease-out-quart',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
