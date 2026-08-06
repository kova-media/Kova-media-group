import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label className={cn('text-sm font-medium text-ink-800', className)} {...props} />
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-ink-900',
        'placeholder:text-ink-400',
        'duration-fast transition-colors',
        'focus-visible:border-accent-600 focus-visible:outline-none',
        'aria-[invalid=true]:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-ink-900',
        'placeholder:text-ink-400',
        'focus-visible:border-accent-600 focus-visible:outline-none',
        'aria-[invalid=true]:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Label + control + error, wired together.
 *
 * The association matters: `aria-describedby` is what makes an error message
 * reach a screen reader at all, and doing it by hand at each call site is how
 * it gets forgotten (CODING_STANDARDS.md §9).
 */
export function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string
  label: string
  error?: string | undefined
  hint?: string | undefined
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => ReactNode
  className?: string
}) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
