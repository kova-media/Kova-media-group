import type { Metadata } from 'next'

import { AdminShell } from '@/features/admin/shell/admin-shell'
import { requireAdmin } from '@/server/auth/dal'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Kova Admin' },
  robots: { index: false, follow: false },
}

/**
 * The admin has no useful static shell: every screen is per-session and must be
 * fresh. `instant = false` opts these routes out of prerendering deliberately,
 * which is the documented escape hatch under Cache Components — not a way to
 * silence a warning we should have fixed.
 *
 * `requireAdmin()` is the real gate; proxy.ts only redirects optimistically
 * (ADR-014). Reading cookies here means the framework guarantees this subtree
 * can never end up cached.
 */
export const instant = false

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const session = await requireAdmin()

  return <AdminShell session={session}>{children}</AdminShell>
}
