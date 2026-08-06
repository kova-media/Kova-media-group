import Link from 'next/link'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { logout } from '@/features/admin/auth/actions'
import type { AdminSession } from '@/server/auth/dal'

import { AdminNav } from './admin-nav'

/**
 * Desktop-first admin chrome. One administrator, so navigation is a flat list
 * rather than a collapsible information architecture.
 */
export function AdminShell({
  session,
  children,
}: {
  session: AdminSession
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-paper-sunk">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <Link href="/admin" className="block">
            <span className="text-2xs font-medium tracking-wide text-ink-500 uppercase">
              Kova
            </span>
            <span className="block text-sm font-medium text-ink-950">Admin</span>
          </Link>
        </div>

        <AdminNav />

        <div className="mt-auto border-t border-border px-5 py-4">
          <p className="truncate text-sm font-medium text-ink-900">{session.name}</p>
          <p className="truncate text-xs text-ink-500">{session.email}</p>
          {/* A form, not a link: sign-out changes state, and Next.js prefetches
              links — which would sign the admin out as they hovered. */}
          <form action={logout} className="mt-3">
            <Button type="submit" variant="ghost" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
