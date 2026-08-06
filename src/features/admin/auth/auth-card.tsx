import type { ReactNode } from 'react'

/** Shared frame for the unauthenticated auth screens. */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-gutter py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-2xs font-medium tracking-wide text-ink-500 uppercase">
            Kova Media Group
          </p>
          <h1 className="mt-2 text-2xl font-medium text-ink-950">{title}</h1>
          {description && <p className="mt-2 text-sm text-ink-500">{description}</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-subtle">
          {children}
        </div>
      </div>
    </main>
  )
}
